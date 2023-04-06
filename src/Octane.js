const request = require('request-promise');
const expand = require('./util/expand');
const { cloneDeep } = require('lodash');

function Octane(opts) {
    this.baseUrl = opts.url;
    this._opts = {
        method: 'GET',
        url: `${opts.url}/api`,
        rejectUnauthorized: false, // avoid first certificate error
        headers: {
            'ALM-OCTANE-TECH-PREVIEW': 'true', // necessary for some endpoints
            'Authorization': 'Basic ' + Buffer.from(opts.apiKey + ':' + opts.secret).toString('base64') // use basic authentication for simplicity
        }
    }
}

Octane.prototype.ref = function ({ spaceId, workspaceId }) {
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

Object.prototype.getEntity = function (entityType, { fields, entityUuid, query }) {
    const self = this;

    const options = {
        ...self._opts,
        qs: {
            fields: fields.join(',') || 'id,name',
            query
        },
        json: true,
        url: self._opts.url + `/${entityType}` + (entityUuid ? `/${entityUuid}` : ''),
    };

    return request(options)
        .then((response) => response.hasOwnProperty('data') ? response.data : response).then((data) => {
            return !Array.isArray(data) ? expand(data) : data.map((entity) => expand(entity));
        })
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
