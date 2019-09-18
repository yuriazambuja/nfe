// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  id: 'br.com.mpl.recebimento', // App bundle ID
  name: 'Recebimento', // App name
  theme: 'ios', // Automatic theme detection
  view: {
    //pushState: true,
    pushStateSeparator:'#',
  },
  // App root data
  data: function () {
    return {
      api: null,
    };
  },
  dialog:{
      buttonCancel: 'Cancelar',
  },
  // App root methods
  methods: {
    recupera:function(){
      for(i in arguments){
        key = arguments[i];
        val = window.localStorage.getItem(key);
        if(val){
          $$("#"+key+" input").val(val);
          $$("#"+key).addClass("item-input-with-value");
        }
      }
    },
    guarda:function(){
      for(i in arguments){
        key = arguments[i];
        val = $$("#"+key+" input").val();
        window.localStorage.setItem(key,val);
      }
    },
    autentica:function(){
      _ = this;
      window.localStorage.setItem("type",_.toggle.get('#type').checked);
      _.methods.guarda("host","port","user");
      _.preloader.show();
      try {
        _.data.api = new orchestrator(function(status){
          _.preloader.hide();
          if(status==200){
            _.view.main.router.navigate("/chave/",{force:true});
          }else if(status==403){
            _.dialog.alert("Autenticação Inválida");
          }else{
            _.dialog.alert("Verifique a Conexão");
          }
        },
        _.toggle.get('#type').checked,$$("#host input").val(),$$("#port input").val(),$$("#user input").val(),$$("#pswd input").val());	
      }catch(error){
        _.dialog.alert("Configurações Inválidas");
        _.preloader.hide();
      }
    },
    chava_acesso:function(chave){
      chave = chave.replace(/[^\d]+/g,'');
      agora = new Date();
      uf = [11,12,13,14,15,16,17,21,22,23,24,25,26,27,28,29,31,32,33,35,41,42,43,50,51,52,53];
      if(chave.length!=44){
        return(null); // TAMANHO INVALIDO
      }else if(chave.substring(0,1)!="9"&&uf.indexOf(Number(chave.substring(0,2)))<0){
        return(null); // UF IBGE INVALIDA
      }else if(Number(chave.substring(4,6))>12){
        return(null); // MES INVALIDO
      }else if(Number(chave.substring(2,6))>((agora.getYear()-100)*100)+agora.getMonth()+1){
        return(null); // ANO MES FUTURO
      }else{
        fator = [2,3,4,5,6,7,8,9];
        digito = 0;
        for(i=0;i<43;i++){
          digito+=chave[42-i]*fator[i%fator.length];
        }
        digito%=11;
        if (digito<=1) {
          digito=0;
        } else {
          digito=(11-digito);
        }
        return(chave[43]==digito?chave:null);
      }
    },
    confirma:function(consulta){
      _ = this;
      _.data.api.MPL_OR_RecebimentoAutomaticoExt(function(status,result){
        _.preloader.hide();
        if(status==200){
          _.dialog.alert("NF-E ENCAMINHADA PARA RECEBIMENTO AUTOMÁTICO COM SUCESSO",null,function(){
            _.view.main.router.navigate("/boleto/"+consulta+"/",{force:true,reloadCurrent:true});
          });
        }else{
          _.dialog.alert("ERRO DE COMUNICAÇÃO: "+status);
        }
      },{AccessKey:consulta});
    },
    consulta:function(consulta,ok){
      _ = this;
      _.preloader.show();
      try{
        _.data.api.MPL_OR_ValidaNFe(function(status,result){
          _.preloader.hide();
          if(status==200){
            if(result.Status=='A'){
              if(ok){ok(true);}
              _.view.main.router.navigate("/pedido/"+consulta+"/",{force:true});
            }else if(result.Status=='R'){
              _.dialog.alert("NF-E COM RECEBIMENTO JÁ SOLICITADO",null,function(){if(ok){ok(false);}});
            }else if(result.Status=='N'){
              _.dialog.alert("NF-E COM XML AINDA NÃO RECUPERADO",null,function(){if(ok){ok(false);}});
            }else if(result.Status=='P'){
              _.dialog.alert("NF-E SEM PEDIDO DE COMPRA ASSOCIADO",null,function(){if(ok){ok(false);}});
            }else{
              _.dialog.alert("NF-E NÃO LIBERADA PARA RECEBIMENTO",null,function(){if(ok){ok(false);}});
            }
          }else{
            _.dialog.alert("ERRO DE COMUNICAÇÃO: "+status,null,function(){if(ok){ok(false);}});
          }
        },{ChaveNFe:consulta});
      }catch(error){
        _.preloader.hide();
        _.dialog.alert(error,null,function(){if(ok){ok(false);}});
      }
    },
    keyboard_nf:function(codigo,ok){
      codigo = this.methods.chava_acesso(codigo);
      if(codigo){
        this.methods.consulta(codigo,ok);
      }else{
        this.dialog.alert("A Chave de Acesso informafa não é válida",null,function(){if(ok){ok(false);}});
      }
    },
    keyboard_bb:function(nfe,codigo,ok){
      codigo = this.methods.linha_digitavel(codigo);
      if(codigo!=null){
        this.methods.registra_boleto(nfe,codigo,ok);
      }else{
        this.dialog.alert("A Linha Digitável informafa não é válida",null,function(){if(ok){ok(false);}});
      }
    },
    scanner_nf:function(){
      _ = this;
      cordova.plugins.barcodeScanner.scan(
        function (result) {
          if(!result.cancelled){
            codigo = _.methods.chava_acesso(result.text);
            if(codigo){
              _.methods.consulta(codigo);
            }else{
              _.dialog.alert("O Código de Barras lido não é válido para Nota Fiscal Eletrônica",null,function(){_.methods.automatico();});
            }
          }
        },
        function (error) {
          _.dialog.alert("ERRO DESCONHECIDO:" + error);
        },
        {
          formats: "CODE_128",
          orientation: "landscape",
          showTorchButton: false,
          torchOn: false,
          prompt: "ENQUADRE O CÓDIGO DE BARRAS DA NOTA FISCAL ELETRÔNICA",
          resultDisplayDuration: 0,
          disableAnimations: true,
          disableSuccessBeep: false
        }
      );
    },
    scanner_bb:function(nfe){
      _ = this;
      cordova.plugins.barcodeScanner.scan(
        function (result){
          if(!result.cancelled){
            codigo = _.methods.codigo_barras(result.text);
            if(codigo!=null){
              _.methods.registra_boleto(nfe,codigo);
            }else{
              _.dialog.alert("O Código de Barras lido não é válido para Boleto Bancário",null,function(){_.methods.automatico_bb(nfe);});
            }
          }
        },
        function (error) {
          _.dialog.alert("ERRO DESCONHECIDO:" + error);
        },
        {
          formats: "ITF",
          orientation: "landscape",
          showTorchButton: false,
          torchOn: false,
          prompt: "ENQUADRE O CÓDIGO DE BARRAS DO BOLETO BANCÁRIO",
          resultDisplayDuration: 0,
          disableAnimations: true, 
          disableSuccessBeep: false
        }
      );
    },
    registra_boleto:function(nf,bb,ok){
      _ = this;
      _.preloader.show();
      try{
        _.data.api.MPL_OR_RecAutoBoleto(function(status,result){
          _.preloader.hide();
          if(status==200){
            if(result.NF){
              if(nf==result.NF){
                _.dialog.alert("Boleto Bancário já associado à mesma Nota Fiscal Eletônica",null,function(){if(ok){ok(false);}});
              }else{
                _.dialog.alert("Boleto Bancário já associado a outra Nota Fiscal Eletônica",null,function(){if(ok){ok(false);}});
              }
            }else{
              if(result.STATUS=="D"){
                _.dialog.alert("Boleto Bancário associado com sucesso à Nota Fiscal Eletônica",null,function(){if(ok){ok(true);}});
              }else{
                _.dialog.alert("Não foi possível associar o Boleto Bancário: "+result.STATUS,null,function(){if(ok){ok(false);}});
              }
            }
          }else{
            _.dialog.alert("ERRO DE COMUNICAÇÃO: "+status,null,function(){if(ok){ok(false);}});
          }
        },{NF:nf,BB:bb});
      }catch(error){
        _.preloader.hide();
        _.dialog.alert(error,null,function(){if(ok){ok(false);}});
      }
    },
    modulo_10:function(str){
      soma = 0;
      peso = 2;
      contador = str.length - 1;
      while (contador >= 0) {
        multiplicacao = (str.substr(contador, 1) * peso);
        if (multiplicacao >= 10) { multiplicacao = 1 + (multiplicacao - 10); }
        soma = soma + multiplicacao;
        if (peso == 2) {
          peso = 1;
        } else {
          peso = 2;
        }
        contador = contador - 1;
      }
      digito = 10 - (soma % 10);
      if (digito == 10) digito = 0;
      return digito;
    },
    modulo_11:function(str){
      soma = 0;
      peso = 2;
      base = 9;
      resto = 0;
      contador = str.length - 1;
      for (i = contador; i >= 0; i--) {
        soma = soma + (str.substring(i, i + 1) * peso);
        if (peso < base) {
          peso++;
        } else {
          peso = 2;
        }
      }
      digito = 11 - (soma % 11);
      if (digito > 9) digito = 0;
      if (digito == 0) digito = 1;
      return digito;
    },
    linha_digitavel:function(str){
      str = str.replace(/[^0-9]/g, '');
      while(str.length<47){
        str+='0';
      }
      _ = this.methods;
      if(str.length==47&&str.substr(9,1)==_.modulo_10(str.substr(0,9))&&str.substr(20,1)==_.modulo_10(str.substr(10,10))&&str.substr(31,1)==_.modulo_10(str.substr(21,10))){
        return(_.codigo_barras(str.substr(0,4)+str.substr(32,15)+str.substr(4,5)+str.substr(10,6)+str.substr(16,4)+str.substr(21,10)));
      }
      return(null);
    },
    codigo_barras:function(str){
      if(str!=null&&str.length==44&&this.methods.modulo_11(str.substr(0,4)+str.substr(5,39))==str.substr(4,1)){
        return(str);
      }
      return(null);
    }
  },
  // App routes
  routes: [
    {
      path:'/',
      beforeEnter: function (routeTo, routeFrom, resolve, reject){
        if(cordova&&screen&&screen.orientation){
          //console.log("screen.orientation=portrait");
          screen.orientation.lock('portrait');
        }
        resolve();
      },
      beforeLeave: function (routeTo, routeFrom, resolve, reject) {
        if(cordova&&screen&&screen.orientation){
          //console.log("screen.orientation=landscape");
          screen.orientation.lock('landscape');
        }
        resolve();
      }
    },
    {
      path: '/chave/',
      componentUrl: './chave.html',
    },  
    {
      path: '/pedido/:nfe/',
      async:function(routeTo, routeFrom, resolve, reject){
        _ = this.app;
        _.preloader.show();
        try{
          _.data.api.MPL_OR_RecAutoDetalhes(function(status,result){
            _.preloader.hide();
            if(status==200){
              resolve(
                {
                  componentUrl: './pedido.html',
                },
                {
                  context: {
                    pedido:result.DETALHES.rowset
                  },
                }
              );
            }else{
              _.dialog.alert("ERRO DE COMUNICAÇÃO: "+status);
              reject();
            }
          },{NFE:routeTo.params.nfe});
        }catch(error){
          _.preloader.hide();
          _.dialog.alert(error);
          reject();
        }
      }
    },
    {
      path: '/boleto/:nfe/',
      componentUrl: './boleto.html',
    }
  ]
});
document.addEventListener("deviceready",function(){
  if(cordova&&screen&&screen.orientation){
    //console.log("screen.orientation=portrait");
    screen.orientation.lock('portrait');
  }
  app.views.create('.view-main');
  app.toggle.get('#type').checked = window.localStorage.getItem("type")=="true";
  app.methods.recupera("host","port","user");
  if($$("#host input").val().trim()==""){
    $$("#conf").addClass("accordion-item-opened");
  }
  $$("#login").on('click',app.methods.autentica);
}, false);