﻿// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  id: 'br.com.azamba.nfe', // App bundle ID
  name: 'Recebimento', // App name
  theme: 'ios', // Automatic theme detection
  view: {
    pushState: true,
    pushStateSeparator:'#',
  },
  // App root data
  data: function () {
    return {
      api: null,
    };
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
      _.methods.recupera("host","port","user");
      _.preloader.show();
      try {
        _.data.api = new orchestrator(function(status){
          _.preloader.hide();
          if(status==200){
            _.view.main.router.navigate("/application/",{force:true});
          }else if(status==403){
            _.dialog.alert("Autenticação Inválida");
          }else{
            _.dialog.alert("Verifique a Conexão");
          }
        },
        _.toggle.get('#type').checked,$$("#host input").val(),$$("#port input").val(),$$("#user input").val(),$$("#pswd input").val());	
      }catch(error){
        console.log(error);
        _.dialog.alert("Configurações Inválidas");
        _.preloader.hide();
      }
    },
    verifica:function(chave){
        if(chave.length!=44){
            return(false);
        }else{
            fator = [2,3,4,5,6,7,8,9];
            digito = 0;
            for(i=0;i<43;i++){
                digito+=chave[42-i]*fator[i%fator.length];
            };
            digito%=11;
            if (digito<=1) {
                digito=0;
            } else {
                digito=(11-digito);
            }
            return(chave[43]==digito);
        }
    },
    consulta:function(consulta){
        _ = this;
        _.preloader.show();
        try {
            _.data.api.MPL_OR_ValidaNFe(function(status,result){
                _.preloader.hide();
                _.dialog.alert(result.Status);
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
        app.dialog.alert("A CHAVE DE ACESSO INFORMDA É INVÁLIDA");
        $$('#keyboard').focus();
      }
    },
    automatico:function(){
      cordova.plugins.barcodeScanner.scan(
        function (result) {
          if(!result.cancelled){
            if(_.methods.verifica(result.text)){
              _.methods.consulta(result.text);
            }else{
              app.dialog.alert("O CÓDIGO DE BARRAS LIDO NÃO É CHAVE DE ACESSO");
              _.methods.automatico();
            }
          }
        },
        function (error) {
          app.dialog.alert("ERRO DESCONHECIDO:" + error);
        },
        {
          //preferFrontCamera : true, // iOS and Android
          //showFlipCameraButton : true, // iOS and Android
          //saveHistory: true, // Android, save scan history (default false)
          formats : "CODE_128,ITF", //"QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
          orientation : "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
          showTorchButton : false, // iOS and Android
          torchOn: false, // Android, launch with the torch switched on (if available)
          prompt : " ",
          resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
          disableAnimations : true, // iOS
          disableSuccessBeep: false // iOS and Android
        }
      );
    }
  },
  // App routes
  routes: [
    {
      path: '/application/',
      componentUrl: './application.html',
    }
  ]
});

// Init/Create main view
app.views.create('.view-main');

app.toggle.get('#type').checked = window.localStorage.getItem("type")=="true";
app.methods.recupera("host","port","user");
$$("#login").on('click',app.methods.autentica);