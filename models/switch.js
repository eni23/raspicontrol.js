module.exports = {
  schema: {
    "type": "object",
    "id": "/switch",
    
    "properties": {
      "id": {
        "type": "string",
        "required": true,
        "isid": true,
      },
      "device": {
        "type": "string",
        "required": true,
        "rev": "device.id",
      },
      "type": {
        "type": "string",
        "required": true,
        "enum": [ "on", "off", "duration" ]
      },
      
      "time": {
        "type": "string",
        "required": true,
        "minLength": 5,
        "pattern": "^[0-9]{2}:[0-9]{2}$"
      },
      
      "duration": {
        "type": "string",
        "default":"0s"
        
      },
      
      
    },
  }
}
