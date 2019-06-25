function orchestrator(done,host,port,user,pswd){
    let _ = function(done,post,path){
        let $ = new XMLHttpRequest();
        $.open(path?"POST":"GET","http://"+host+":"+port+"/jderest/"+(path?"v2/orchestrator/"+path:"discover"),true);
        $.setRequestHeader("Content-Type","application/json");	
        $.setRequestHeader("Authorization","Basic "+btoa(user+":"+pswd));
        $.onreadystatechange=function(){
            if($.readyState===XMLHttpRequest.DONE){
                try{
                    done($.status,JSON.parse($.responseText));
                }catch(_){
                    done($.status,null);
                }
            }
        };
        $.send(JSON.stringify(post?post:{}));
    };
    _(function(code,data){
        if(200<=code&&code<=299){
            for(let $ in data.orchestrations){
                orchestrator.prototype[data.orchestrations[$].name] = function(done,post){
                    return(_(done,post,data.orchestrations[$].name));
                };
            }
        }
        done(code);
    });
};