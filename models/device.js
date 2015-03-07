module.exports = {
  schema: {
    "type": "object",
    "id": "/devive",
    "properties": {
      "id": {
        "type": "string",
        "required": true,
        "isid": true,
      },
      "port": {
       "type": "integer",
        "required": true,
        "unique": true,
      },
      "name": {
        "type": "string",
        "default": "new device"
      },
      "icon": {
        "type": "string",
        "default": "fa-star"
      },
      "color": {
        "type": "string",
        "default": "#4B7FB2"
      },
    },
  }
  
 }
