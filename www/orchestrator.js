function orchestrator(done,ssl,host,port,user,pswd){
    let self = this;
    let call = function(done,post,path){
        let http = new XMLHttpRequest();
        http.open(path?"POST":"GET","http"+(ssl?'s':'')+"://"+host+":"+port+"/jderest/"+(path?"v2/orchestrator/"+path:"discover"),true);
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
        http.send(JSON.stringify(post?post:{}));
    };
    call(function(code,data){
        if(200<=code&&code<=299){
            for(let loop in data.orchestrations){
                self[data.orchestrations[loop].name] = function(done,post){
                    return(call(done,post,data.orchestrations[loop].name));
                };
            }
        }
        done(code);
    });
}