import esriRequest from "esri/request";
import config from "../appConfig";

export default class ElasticsearchStore {
  static getAggregatedSessions(appId: string) {
    return esriRequest(config.elasticsearch_url, {
      responseType: "json",
      headers: {
        "content-type": "application/json"
      },
      body: `{
               "query": {
                  "bool": {
                     "minimum_should_match": 1,
                     "should": [
                        {
                           "term": {
                              "message.keyword": "map-init CENTER_CHANGED"
                           }
                        },
                        {
                           "term": {
                              "message.keyword": "Framework  STARTED"
                           }
                        }
                     ],
                     "must": [
                        { 
                           "range" : { "map_scale" : { "lte" : 280000, "gte": 0 }}
                        },
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
                                    "timestamp",
                                    "supportive",
                                    "easy",
                                    "efficient",
                                    "clear",
                                    "exciting",
                                    "interesting",
                                    "inventive",
                                    "leadingEdge"
                                 ]
                              },
                              "size":100
                           }
                        }
                     }
                  }
               }
            }`
    }).then(function(response) {
      return response.data.aggregations;
    });
  }
}
