##### Create Temp User ############################
POST http://localhost:1404/lesan
{
  "service":"main",
  "model":"user",
  "act":"tempUser",
   "details": {
      "get": {
        "_id": 1,
        "first_name": 1,
        "last_name": 1,
        "father_name": 1,
        "mobile": 1,
        "gender": 1,
        "birth_date": 1,
        "summary": 1,
        "national_number": 1,
        "address": 1,
        "level": 1,
        "is_verified": 1,
        "createdAt": 1,
        "updatedAt": 1,
        "avatar": {
          "_id": 1,
          "name": 1,
          "type": 1,
          "size": 1,
          "createdAt": 1,
          "updatedAt": 1
        },
        "national_card": {
          "_id": 1,
          "name": 1,
          "type": 1,
          "size": 1,
          "createdAt": 1,
          "updatedAt": 1
        },
        "uploadedAssets": {
          "_id": 1,
          "name": 1,
          "type": 1,
          "size": 1,
          "createdAt": 1,
          "updatedAt": 1
        }
      },
      "set": {
        "first_name": "سید امیر",
        "last_name": "حسینی",
        "father_name": "سید حسن",
        "mobile": "09381028800",
        "national_number": "3875523474"
      }
  }
}


#####   Login User ############################
POST http://localhost:1404/lesan
{
  "service":"main",
    "model": "user",
    "act": "loginReq",
    "details": {
      "get": {
        "mobile": 1,
        "national_number": 1
      },
      "set": {
        "national_number": "3875523474"
      }
     }
  }


#####   Login User ############################
POST http://localhost:1404/lesan
{
  "service":"main",
    "model": "user",
    "act": "login",
    "details": {
      "get": {
        "token": 1,
        "user": {
          "_id": 1,
          "first_name": 1,
          "last_name": 1,
          "mobile": 1,
          "national_number": 1,
          "level": 1,
          "is_verified": 1,
          "createdAt": 1,
          "national_card": {
            "_id": 1,
            "name": 1
          }
        }
      },
      "set": {
        "national_number": "3875523474",
        "code": "11111"
      }
      }
      }

HTTP/1.1 200
[Captures]
token: jsonpath "$['body']['token']"


#####   Login User ############################
POST http://localhost:1404/lesan
token:{{token}}

{
    "service": "main",
    "model": "user",
    "act": "seed",
    "details": {
      "get": {
        "ok": 1
      },
      "set": {}
    }
  }

