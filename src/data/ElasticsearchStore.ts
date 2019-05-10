import esriRequest from "esri/request";

const URL = "http://localhost:9200/mapapps/_search";

export default class ElasticsearchStore {
    static getAggregatedSessions(appId: string){
        return esriRequest(URL, {
            responseType: "json",
            headers: {
                "content-type": "application/json"
            },
            body: `{
                "query": {
                    "bool": {
                        "must": [
                            {
                                "term" : { "app_id" : "${appId}" }
                            },
                            {
                                "exists" : { "field" : "map_center" }
                            }
                        ]
                    }
                },
                "size":0,
                "aggs":{  
                   "sessions":{  
                      "terms":{  
                         "field":"session.keyword",
                         "size":100
                      },
                      "aggs":{  
                         "events":{  
                            "top_hits":{  
                               "sort":[  
                                  {  
                                     "timestamp":{  
                                        "order":"asc",
                                        "unmapped_type":"long"
                                     }
                                  }
                               ],
                               "_source":{  
                                  "includes":[  
                                     "map_scale",
                                     "map_zoom",
                                     "map_center",
                                     "message",
                                     "timestamp"
                                  ]
                               },
                               "size":100
                            }
                         }
                      }
                   }
                }
             }`
          }).then(function(response){
            return response.data.aggregations;
          });
    }
}