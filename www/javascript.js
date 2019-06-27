﻿
		var ais;

		function startup(){
			loading(false);
			$('#comando').click(function(){
				if($('#codigo').val().length){
					linhaDigitavel();
				}else{
					codigoDeBarras();
				}
			});
			$('#codigo').keyup(codigo);
			codigo();
			loading(true);
			ais = new orchestrator(function(status){
				loading(false);
			},false,"192.168.0.19","9050","JDE","JDE");	
		}

		function codigo(){
			let chave = $('#codigo').val().replace(/\D/g,'');
			$('#comando').text(chave.length?"CONSULTAR DIGITACAO":"LER CODIGO DE BARRAS");
			$('#codigo').val(chave);
		}

		function loading(status){
			if(status){
				$('body').addClass("loading");
			}else{
				$('body').removeClass("loading");
			}
		}

		function digitoVerificador(chave){
			if(chave.length!=44){
				return(false);
			}else{
				let fator = [2,3,4,5,6,7,8,9];
				let digito = 0;
				for(let i=0;i<43;i++){
					digito+=chave[43-i]*fator[i%fator.length];
				}
				digito%=11;
				if (digito<=1) {
					digito=0;
				} else {
					digito=(11-digito);
				}
				return(chave[43]==digito);
			}
		}

		function chaveDeAcesso(consulta){
			loading(true);
			ais.FornecedoresOffLine5(function(code,data){
				loading(false);
				console.log(code);
				console.log(data);
				alert(consulta);
			},{nfe:consulta});
		}

		function linhaDigitavel(){
			if(digitoVerificador($('#codigo').val())){
				chaveDeAcesso($('#codigo').val());
			}else{
				alert("A CHAVE DE ACESSO INFORMDA E INVALIDA");
				$('#codigo').focus();
			}
		}

		function codigoDeBarras(){
			cordova.plugins.barcodeScanner.scan(
				function (result) {
					if(!result.cancelled){
						if(digitoVerificador(result.text)){
							chaveDeAcesso(result.text);
						}else{
							alert("O CODIGO DE BARRAS LIDO NaO E CHAVE DE ACESSO");
							codigoDeBarras();
						}
					}
				},
				function (error) {
					alert("ERRO DESCONHECIDO:" + error);
				},
				{
					//preferFrontCamera : true, // iOS and Android
					//showFlipCameraButton : true, // iOS and Android
					//saveHistory: true, // Android, save scan history (default false)
					//formats : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
					//orientation : "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
					showTorchButton : false, // iOS and Android
					torchOn: false, // Android, launch with the torch switched on (if available)
					prompt : " ",
					//prompt : "POSICIONE O CÓDIGO DE BARRAS NA ÁREA INDICADA", // Android
					resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
					disableAnimations : true, // iOS
					disableSuccessBeep: false // iOS and Android
				}
			);
		}