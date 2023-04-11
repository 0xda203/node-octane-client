const request = require('request-promise');
const expand = require('./util/expand');
const chunk = require('./util/chunk');
const keepFields = require('./util/keepFields');
const { cloneDeep } = require('lodash');
const { map } = require("bluebird");
const promiseRetry = require('promise-retry')

const MAX_ITEMS_PER_REQUEST = 100;

function Octane(opts) {
    this.baseUrl = opts.url;
    this._opts = {
        method: 'GET',
        url: `${opts.url}/api`,
        rejectUnauthorized: false, // avoid first certificate error
        headers: {
            'ALM-OCTANE-TECH-PREVIEW': 'true', // necessary for some endpoints
            "hpeclienttype": "HPE_MQM_UI", // header to support some requests
            'Authorization': 'Basic ' + Buffer.from(opts.apiKey + ':' + opts.secret).toString('base64') // use basic authentication for simplicity
        }
    }
}

Octane.prototype.ref = function ({ spaceId, workspaceId = 500 }) {
    const extended = cloneDeep(this) // clone the object to avoid side effects

    // add the space and workspace to the url if present
    if (spaceId || extended.spaceId) {
        extended.spaceId = spaceId || extended.spaceId;
        extended._opts.url = `${extended._opts.url}/shared_spaces/${extended.spaceId}`;
        delete extended.workspaceId;
    }

    if (workspaceId || extended.workspaceId) {
        extended.workspaceId = workspaceId || extended.workspaceId;
        extended._opts.url = `${extended._opts.url}/workspaces/${extended.workspaceId}`;
    }

    return extended;
}

Object.prototype.getEntity = function (entityType, { fields, UUID, query, limit }) {
    const self = this;

    fields = fields ? fields.join(',') : 'id,name';

    const options = {
        ...self._opts,
        qs: {
            fields,
            ...(!!query) && { query: `"${query}"` },
            ...(!!limit) && { limit: limit },
        },
        json: true,
        url: self._opts.url + `/${entityType}` + (UUID ? `/${UUID}` : ''),
    };

    return request(options)
        .then((response) => {
            return response.hasOwnProperty('data') ? response.data : response
        }).then((data) => {
            return !Array.isArray(data) ? expand(data) : data.length === 1 ? keepFields(expand(data[0]), fields.split(',')) : data.map((entity) => keepFields(expand(entity), fields.split(',')));
        })
}

Object.prototype.createEntity = function (entityType, entities) {
    const self = this;

    function insertEntity(entityType, data) {
        return request({
            ...self._opts,
            method: 'POST',
            body: {
                data
            },
            json: true,
            url: self._opts.url + `/${entityType}`,
        })
    }

    const chunks = Array.isArray(entities) ? [...chunk(entities, MAX_ITEMS_PER_REQUEST)] : [[entities]];

    return map(chunks, chunk => {
        return promiseRetry((retry, _) => {
            return insertEntity(entityType, chunk)
                .catch(err => {
                    if (err.message) console.error(err.message);
                    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET') {
                        retry();
                    }
                });
        }, { retries: 1000, minTimeout: 1000, maxTimeout: 10000 });
    }, { concurrency: 3 });

}

Object.prototype.updateEntity = function (entityType, data) {
    const self = this;

    const options = {
        ...self._opts,
        method: 'PUT',
        body: {
            data: Array.isArray(data) ? data : [data]
        },
        json: true,
        url: self._opts.url + `/${entityType}`,
    };

    return wrapRequest(request(options))
}

Object.prototype.getAttachmentData = function (attachmentId) {
    const self = this;

    const options = {
        ...self._opts,
        encoding: null,
        url: self._opts.url + `/attachments/${attachmentId}`,
    };

    return request(options)
}

Object.prototype.createAttachment = function ({ name, owner_work_item_id, data }) {
    const self = this;

    const options = {
        ...self._opts,
        method: 'POST',
        url: self._opts.url + `/attachments`,
        qs: {
            name,
            owner_work_item: owner_work_item_id
        },
        body: data,
        headers: {
            ...self._opts.headers,
            'Content-Type': 'application/octet-stream'
        }
    }

    return request(options)
        .then((response) => response.data)
}

Octane.ENTITY_TYPES = {
    attachments: 'attachments',
    stories: 'stories',
    work_items: 'work_items',
    releases: 'releases',
    features: 'features',
    defects: 'defects',
    teams: 'teams',
    test_manual: 'manual_tests',
    manual_runs: 'manual_runs',
    run_steps: 'run_steps',
    list_nodes: 'list_nodes',
    metadata_fields: 'metadata_fields',
    phases: 'phases',
    teams: 'teams',
    transitions: 'transitions',
    workspace_users: 'workspace_users',
    users: 'users',
    work_item_roots: 'work_item_roots',
    epics: 'epics',
    sprints: 'sprints',
    fields: 'metadata/fields',
    metaphases: 'metaphases',
    workspace_roles: 'workspace_roles',
    tests: 'tests',
    tasks: 'tasks',
    user_tag: 'user_tags',
    comments: 'comments',
    programs: 'programs',
    quality_stories: 'quality_stories',
    milestones: 'milestones',
    application_modules: 'application_modules',
}

module.exports = Octane 
