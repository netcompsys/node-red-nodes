/**
 * Copyright 2013, 2015 Kris Daniels, IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    var pg=require('pg');
    var named=require('node-postgres-named');
    var querystring = require('querystring');
    
    function PostgresDatabaseNode(n) {
        RED.nodes.createNode(this,n);
        this.hostname = n.hostname;
        this.port = n.port;
        this.db = n.db;
        this.user = this.credentials.user;
        this.password = this.credentials.password;
    }
    
    RED.nodes.registerType("postgresdb",PostgresDatabaseNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });
    
    function PostgresNode(n) {
        RED.nodes.createNode(this,n);
        
        this.topic = n.topic;
        this.postgresdb = n.postgresdb;
        this.postgresConfig = RED.nodes.getNode(this.postgresdb);
        this.sqlquery = n.sqlquery;
        this.output = n.output;
        
        var node = this;
    
        if(this.postgresConfig)
        {
            
            var conString = 'postgres://'+this.postgresConfig.user +':' + this.postgresConfig.password + '@' + this.postgresConfig.hostname + ':' + this.postgresConfig.port + '/' + this.postgresConfig.db;
            node.clientdb = new pg.Client(conString);
            named.patch(node.clientdb);
    
            node.clientdb.connect(function(err){
                    if(err) { node.error(err); }
                    else {
                        node.on('input', 
                            function(msg){
                                if(!msg.queryParameters) msg.queryParameters={};
                                node.clientdb.query(msg.payload,
                                             msg.queryParameters,
                                             function (err, results) {
                                                 if(err) { node.error(err); }
                                                 else {
                                                    if(node.output)
                                                    {
                                                        msg.payload = results.rows;
                                                        node.send(msg);
                                                    }
                                                 }
                                             });
                            });
                    }
            });
        } else {
            this.error("missing postgres configuration");
        }
        
        this.on("close", function() {
            if(node.clientdb) node.clientdb.end();
        });
    }
    
    RED.nodes.registerType("postgres",PostgresNode);
}
