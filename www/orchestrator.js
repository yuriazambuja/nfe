function orchestrator(done,ssl,host,port,user,pswd){
    self = this;
    call = function(done,post,path){
        http = new XMLHttpRequest();
        url = "http"+(ssl?'s':'')+"://"+host+":"+port+"/jderest/"+(path?"v2/orchestrator/"+path:"discover");
        console.log(path?"POST":"GET");
        console.log(url);
        console.log(JSON.stringify(post?post:{}));
        http.open(path?"POST":"GET",url,true);
        http.setRequestHeader("Content-Type","application/json");	
        http.setRequestHeader("Authorization","Basic "+btoa(user+":"+pswd));
        http.onreadystatechange = function(){
            if(http.readyState===XMLHttpRequest.DONE){
                try{
                    done(http.status,JSON.parse(http.responseText));
                }catch(e){
                    done(http.status,null);
                }
            }
        };
        http.timeout = 2000;
        http.send(JSON.stringify(post?post:{}));
    };
    call(function(code,data){
        if(200<=code&&code<=299){
            for(loop in data.orchestrations){
                self[data.orchestrations[loop].name] = function(done,post){
                    return(call(done,post,data.orchestrations[loop].name));
                };
            }
        }
        done(code);
    });
}
