# Node.js ALM Octane REST API Wrapper

A node.js module, which provides a wrapper for the ALM Octane Rest API v.15.1.90.

[![ALM Octane Rest API](https://img.shields.io/badge/ALM%20Octane%20Rest%20API--green.svg)](https://admhelp.microfocus.com/octane/en/15.1.90/Online/Content/API/articles_API2.htm?Highlight=rest%20api)

## Installation

Install with the node package manager [npm](http://npmjs.org):

```shell
$ npm install --save https://github.com/0xda203/node-octane-client/main
```

## Examples

### Create the Octane client

```javascript
const Octane = require("node-octane-client");

const client = new Octane({
  url: "jira.somehost.com",
  apiKey: "some_api_key",
  secret: "some_api_secret",
});
```

### Get reference to space and workspace

```javascript
const space = client.ref({ spaceId: 11111 });
const workspace = space.ref({ workspaceId: 22222 });
const workspace2 = client.ref({ spaceId: 11111, workspaceId: 22222 });
const workspace3 = client.ref({ spaceId: 11111 }).ref({ workspaceId: 22222 });
```

### Get all work_items of a given workspace

```javascript
const workItems = await workspace.getEntity(Octane.ENTITY_TYPES.work_items, {
  fields: [
    "id",
    "name",
    "subtype",
    "parent{}",
    "release",
    "team",
    "has_attachments",
    "attachments{}",
  ],
  query: `"team EQ {id eq 1111}; release EQ {id IN ${[2222, 3333].join(",")}}"`,
});
```

### Get a specific work_item with a given id in a given workspace

```javascript
const workItem = await workspace.getEntity(Octane.ENTITY_TYPES.work_items, {
  fields: [
    "id",
    "name",
    "subtype",
    "parent{}",
    "release",
    "team",
    "has_attachments",
    "attachments{}",
  ],
  entityUuid: 1111,
});
```

### Create attachent for an work_item

```javascript
// create a attachement
workspace.createAttachment({
  name: "some_file_name",
  owner_work_item_id: 33333,
  data: "some_buffer_data",
});
```
