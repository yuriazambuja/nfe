// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  id: 'br.com.mpl.recebimento', // App bundle ID
  name: 'Recebimento', // App name
  theme: 'ios', // Automatic theme detection
  //view: {
  //  pushState: true,
  //  pushStateSeparator:'#',
  //},
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
    verifica:function(chave){
      chave = chave.replace(/[^\d]+/g,'');
      agora = new Date();
      uf = [11,12,13,14,15,16,17,21,22,23,24,25,26,27,28,29,31,32,33,35,41,42,43,50,51,52,53];
      if(chave.length!=44){
        return(false); // TAMANHO INVALIDO
      }else if(chave.substring(0,1)!="9"&&uf.indexOf(Number(chave.substring(0,2)))<0){
        return(false); // UF IBGE INVALIDA
      }else if(Number(chave.substring(4,6))>12){
        return(false); // MES INVALIDO
      }else if(Number(chave.substring(2,6))>((agora.getYear()-100)*100)+agora.getMonth()+1){
        return(false); // ANO MES FUTURO
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
        return(chave[43]==digito);
      }
    },
    confirma:function(consulta){
      _ = this;
      _.view.main.router.navigate("/boleto/"+consulta+"/",{force:true,reloadCurrent:true});
      
      //_.view.main.router.navigate("/boleto/"+consulta+"/",{force:true});
      /*
        _.data.api.MPL_OR_RecebimentoAutomaticoExt(function(status,result){
          _.preloader.hide();
          if(status==200){
            _.dialog.alert("NF-E ENCAMINHADA PARA RECEBIMENTO AUTOMÁTICO COM SUCESSO");
          }else{
            _.dialog.alert("ERRO DE COMUNICAÇÃO: "+status);
          }
        },{AccessKey:consulta});
      */
    },
    consulta:function(consulta){
      _ = this;
      _.preloader.show();
      try{
        _.data.api.MPL_OR_ValidaNFe(function(status,result){
          _.preloader.hide();
          if(status==200){
            if(result.Status=='A'){
              _.view.main.router.navigate("/pedido/"+consulta+"/",{force:true});
            }else if(result.Status=='R'){
              _.dialog.alert("NF-E COM RECEBIMENTO JÁ SOLICITADO");
            }else if(result.Status=='N'){
              _.dialog.alert("NF-E COM XML AINDA NÃO RECUPERADO");
            }else if(result.Status=='P'){
              _.dialog.alert("NF-E SEM PEDIDO DE COMPRA ASSOCIADO");
            }else{
              _.dialog.alert("NF-E NÃO LIBERADA PARA RECEBIMENTO");
            }
          }else{
            _.dialog.alert("ERRO DE COMUNICAÇÃO: "+status);
          }
        },{ChaveNFe:consulta});
      }catch(error){
        _.preloader.hide();
        _.dialog.alert(error);
      }
    },
    manual:function(){
      _ = this;
      if(_.methods.verifica($$('#keyboard').val())){
        _.methods.consulta($$('#keyboard').val());
      }else{
        app.dialog.alert("A Chave de Acesso informafa não é válida");
        $$('#keyboard').focus();
      }
    },
    manual_bb:function(codigo){
      console.log(codigo);
      codigo = this.methods.linha_digitavel(codigo);
      console.log(codigo);
      if(codigo!=null){
        this.methods.registra_boleto(codigo);
      }else{
        this.dialog.alert("A Linha Digitável informafa não é válida");
        $$('#keyboard_bb').focus();
      }
    },
    automatico:function(){
      _ = this;
      cordova.plugins.barcodeScanner.scan(
        function (result) {
          if(!result.cancelled){
            if(_.methods.verifica(result.text)){
              _.methods.consulta(result.text);
            }else{
              _.dialog.alert("O Código de Barras lido não é válido para Nota Fiscal Eletrônica",null,_.methods.automatico);
            }
          }
        },
        function (error) {
          _.dialog.alert("ERRO DESCONHECIDO:" + error);
        },
        {
          //preferFrontCamera : true, // iOS and Android
          //showFlipCameraButton : true, // iOS and Android
          //saveHistory: true, // Android, save scan history (default false)
          formats: "CODE_128", //"QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
          orientation: "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
          showTorchButton: false, // iOS and Android
          torchOn: false, // Android, launch with the torch switched on (if available)
          prompt: "APONTE PARA A NOTA FISCAL ELETRÔNICA",
          resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
          disableAnimations: true, // iOS
          disableSuccessBeep: false // iOS and Android
        }
      );
    },
    automatico_bb:function(){
      _ = this;
      cordova.plugins.barcodeScanner.scan(
        function (result){
          if(!result.cancelled){
            codigo = codigo_barras(result.text);
            if(codigo!=null){
              _.methods.registra_boleto(codigo);
            }else{
              _.dialog.alert("O Código de Barras lido não é válido para Boleto Bancário",null,_.methods.automatico_boleto);
            }
          }
        },
        function (error) {
          _.dialog.alert("ERRO DESCONHECIDO:" + error);
        },
        {
          //preferFrontCamera : true, // iOS and Android
          //showFlipCameraButton : true, // iOS and Android
          //saveHistory: true, // Android, save scan history (default false)
          formats: "ITF", //"QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
          orientation: "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
          showTorchButton: false, // iOS and Android
          torchOn: false, // Android, launch with the torch switched on (if available)
          prompt: "APONTE PARA O BOLETO BANCÁRIO",
          resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
          disableAnimations: true, // iOS
          disableSuccessBeep: false // iOS and Android
        }
      );
    },
    registra_boleto:function(codigo){
      console.log(codigo);
    },
    modulo_10:function(str){
      var soma = 0;
      var peso = 2;
      var contador = str.length - 1;
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
      var digito = 10 - (soma % 10);
      if (digito == 10) digito = 0;
      return digito;
    },
    modulo_11:function(str){
      var soma = 0;
      var peso = 2;
      var base = 9;
      var resto = 0;
      var contador = str.length - 1;
      for (var i = contador; i >= 0; i--) {
        soma = soma + (str.substring(i, i + 1) * peso);
        if (peso < base) {
          peso++;
        } else {
          peso = 2;
        }
      }
      var digito = 11 - (soma % 11);
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
          console.log("screen.orientation=portrait");
          screen.orientation.lock('portrait');
        }
        resolve();
      },
      beforeLeave: function (routeTo, routeFrom, resolve, reject) {
        if(cordova&&screen&&screen.orientation){
          console.log("screen.orientation=landscape");
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
                    pedido:result.ServiceRequest1.fs_DATABROWSE_F55MPL02.data.gridData.rowset
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
    console.log("screen.orientation=portrait");
    screen.orientation.lock('portrait');
  }
  app.views.create('.view-main');
  app.toggle.get('#type').checked = window.localStorage.getItem("type")=="true";
  app.methods.recupera("host","port","user");
  $$("#login").on('click',app.methods.autentica);
}, false);