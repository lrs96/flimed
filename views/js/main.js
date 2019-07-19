$ = jQuery.noConflict();
romae = {
	modalNews: function(){
		if (typeof(Storage) !== "undefined") {
			if(!localStorage.getItem('modal')) {
				localStorage.setItem("modal", false);
			} 
		}

		$(document).bind("mouseleave", function(e) {
			if(localStorage.getItem('modal') === 'false') {
				localStorage.setItem('modal', true);
				if (e.pageY - $(window).scrollTop() <= 1) {  
					$("#romae_news").fadeIn();
				}
			}
		});

		$("#romae_close").click(function () {
			$("#romae_news").fadeOut("slow");
		});

		$(".romae-mask").click(function () {
			$("#romae_news").fadeOut("slow");
		});
	},
	menu: function(){
		$('#nav_mobile').click(function() {
			var windowWidth = $(window).outerWidth();	


			if(windowWidth >= 992){
				$(this).toggleClass('nav-active mobile-lg');
				$("#header_painel").toggleClass('menu-active');
			} else {
				$(this).toggleClass('nav-active').removeClass('mobile-lg');
				$("#header_painel").toggleClass('active').removeClass('menu-active');
			}
		});
	},
	iobtn:function(){
		$(".io-toggler").each(function(){
			var io = $(this).data("io"),
					$opts = $(this).find(".io-options"),
					$clon = $opts.clone(),
					$span = $clon.find("span"),
					width = $opts.width()/2;

			$(this).append($clon);

			function swap(x) {
				$clon.stop().animate({left:  x}, 150);
				$span.stop().animate({left: -x}, 150);
				$(this).data("io", x===0 ? 0 : 1);
			}

			$clon.draggable({
				axis:"x",
				containment:"parent",
				drag:function(evt, ui){
					$span.css({left: -ui.position.left});
				},
				stop:function(evt, ui){
					swap( ui.position.left < width/2 ? 0 : width );
				}
			});

			$opts.on("click", function(){
				swap( $clon.position().left>0 ? 0 : width );
			});

			// Read and set initial predefined data-io
			if(!!io)$opts.trigger("click");
			// on submit read $(".io-toggler").data("io") value
		});

		$('.clinica').click(function() {
			$('.profissional-saude').removeClass('active');
			$('.centro-medico').addClass('active');
		});

		$('.doctors').click(function() {
			$('.profissional-saude').addClass('active');
			$('.centro-medico').removeClass('active');
		});

		$('#btn_close').click(function() {
			$('#msg_box').hide('slow');
		});

		$('#notification').click(function() {
			$('body').toggleClass('notification-active');
		});

		$('#notification_close').click(function() {
			$('body').toggleClass('notification-active');
		});

		$('#mask').click(function() {
			$('body').toggleClass('notification-active');
		});

		$('#mask_main').click(function() {
			$('body').toggleClass('notification-active');
		});
	},
	banner: function(){
		$("#owl-banner").owlCarousel({
			loop: false,
			autoplay: true,
			items: 1,
			margin: 0,
			autoplay:true,
			autoplayTimeout:10000,
			autoplayHoverPause:true,
			animateOut: 'fadeOut',
			responsive:{
				0:{
					touchDrag : true,
					mouseDrag : true,
				},
				1000:{
					touchDrag : false,
					mouseDrag : false,
				}
			}

		});
	},
	owl_qa: function(){
		$("#owl_qa").owlCarousel({
			loop:true,
			items: 1,
			margin: 0,
			autoplay:true,
			autoplayTimeout:8000,
			animateOut: 'fadeOut',
			dots: true,
			responsive:{
				0:{
					touchDrag : true,
					mouseDrag : true,
				},
				1000:{
					touchDrag : false,
					mouseDrag : false,
				}
			}
		});
	},
	owl_feedback: function(){
		$("#owl_feedback").owlCarousel({
			loop:true,
			items: 1,
			margin: 0,
			autoplay:true,
			autoplayTimeout:5000,
			animateOut: 'fadeOut',
			dots: true,
			responsive:{
				0:{
					touchDrag : true,
					mouseDrag : true,
				},
				1000:{
					touchDrag : false,
					mouseDrag : false,
				}
			}
		});
	},
	gallery: function(){
		//$('.gallery-photos__pht').fancybox();

		//$(".gallery-photos__vid").fancybox();

		$("a#gallery_media").fancybox({
			onComplete  :   function() {
				$('.ui-draggable-handle').hide();
				romae.menu();

				$('#btnGallery_photos').click(function() {
					$('.gallery-box--photos').addClass('active');
					$('.gallery-box--videos').removeClass('active');
				});

				$('#btnGallery_videos').click(function() {
					$('.gallery-box--videos').addClass('active');
					$('.gallery-box--photos').removeClass('active');
				});
			},
		});
	},
	accordion: function(){
		$('#accordion').find('.accordion-toggle').click(function(){
			$(this).next().slideToggle('fast');
			$(this).toggleClass('active');

			$(".accordion-content").not($(this).next()).slideUp('fast');
			$('#accordion').find('.accordion-toggle').not($(this)).removeClass('active');
		});
	},
	tags: function(){
		$('#input_tags').selectize({
			plugins: ['remove_button'],
			delimiter: ',',
			persist: false,
			create: function(input) {
				return {
					value: input,
					text: input
				}
			}
		});
		$('#input_tags2').selectize({
			plugins: ['remove_button'],
			delimiter: ',',
			persist: false,
			create: function(input) {
				return {
					value: input,
					text: input
				}
			}
		});

		$("#selectDays_all").click(function () {
			$('.inputs-checkbox__item input:checkbox').not(this).prop('checked', this.checked);
		});

		/*Dropzone.options.file_ads = {
			paramName: "file",
			dictDefaultMessage: "Olá",
		};*/
	},
	atendimento: function(){
		$('#btn_start').click(function(){
			$(this).hide();
			$('#btn_finish').show();
		});
	},
	scrollItens: function(){
		if(document.getElementById( 'cbp-so-scroller' ) != null){
			new cbpScroller( document.getElementById( 'cbp-so-scroller' ) ); 
		}
	},
	menuItem: () => {
		$(document).ready( () => {
			if($("section").hasClass("medico-perfil") ) {
				$("ul.menu a[href='/medico-perfil']").addClass("active");
			} else if ($("section").hasClass("medico-anuncios")) {
				$("ul.menu a[href='/medico-anuncios']").addClass("active")
			} else if ($("section").hasClass("medico-painel")) {
				$("ul.menu a[href='/medico-painel']").addClass("active")
			} else if ($(".container.ad-box").hasClass("medico-horarios")) {
				$("ul.menu a[href='/medico-horarios']").addClass("active")
			}	else if ($("section").hasClass("medico-perguntas")) {
				$("ul.menu a[href='/medico-perguntas']").addClass("active")
			} else if ($("section").hasClass("medico-financeiro")) {
				$("ul.menu a[href='/medico-financeiro']").addClass("active")
			} else if ($(".row").hasClass("medico-contabilidade")) {
				$("ul.menu a[href='/medico-contabilidade']").addClass("active")
			} else if ($(".row").hasClass("medico-historico")) {
				$("ul.menu a[href='/medico-historico']").addClass("active")
			} else if ($(".box__panel").hasClass("cliente-painel")) {
				$("ul.menu a[href='/cliente-painel']").addClass("active")
			} else if ($(".box__panel").hasClass("perfil-cliente")) {
				$("ul.menu a[href='/cliente-perfil']").addClass("active")
			} else if ($(".box__panel").hasClass("cliente-historico")) {
				$("ul.menu a[href='/cliente-historico']").addClass("active")
			} else if ($(".box__questions").hasClass("cliente-perguntas")) {
				$("ul.menu a[href='/cliente-perguntas']").addClass("active")
			} else if ($(".ad-box").hasClass("cliente-horarios")) {
				$("ul.menu a[href='/cliente-horarios']").addClass("active")
			} else if ($(".box__panel").hasClass("clinica-perfil")) {
				$("ul.menu a[href='/clinica-perfil']").addClass("active")
			} else if ($(".ad-box").hasClass("clinica-horarios")) {
				$("ul.menu a[href='/clinica-horarios']").addClass("active")
			} else if ($(".box__panel").hasClass("clinica-painel")) {
				$("ul.menu a[href='/clinica-painel']").addClass("active")
			} else if ($(".box__panel").hasClass("clinica-financeiro")) {
				$("ul.menu a[href='/clinica-financeiro']").addClass("active")
			} else if ($(".box__panel").hasClass("clinica-contabilidade")) {
				$("ul.menu a[href='/clinica-contabilidade']").addClass("active")
			} else if ($(".box__panel").hasClass("clinica-historico")) {
				$("ul.menu a[href='/clinica-historico']").addClass("active")
			} else if ($(".box__panel").hasClass("clinica-perguntas")) {
				$("ul.menu a[href='/clinica-perguntas']").addClass("active")
			} 
		});
	},
	addMaisEspecialidade: () => {
		const inputEspecialidade = `<input type="text" name="especialidade" style="padding-top: 15px;" placeholder="Outra especialidade">`;
		$("#addEspecialidade").click( () => {
			$("#input-especialidades").append(inputEspecialidade);
			console.log("Clicado");
		})
	},
	addLocaldeAtendimento: () => {
		const inputAtendimento = `<input type="text" name="description" style="padding-top: 15px" placeholder="Outro local de atendimento">`;
		$("#addLocalAtendimento").on("click", () => {
			$(".input-local-de-atendimento:nth-child(1)").append(inputAtendimento);
		})
	},
	addMaisPremio: () => {
		const inputPremios = `<input type="text" name="description" style="padding-top: 15px;" placeholder="Escreva sobre este premio">`;
		$("#addPremios").click( () => {
			$("#input-premios").append(inputPremios);
			console.log("Clicado");
		});
	}

}


$(function() {
	romae.menu();
	romae.owl_qa();
	romae.owl_feedback();
	romae.gallery();
	romae.accordion();
	romae.tags();
	romae.atendimento();
	romae.scrollItens();
	romae.iobtn();
	romae.menuItem();
	romae.addLocaldeAtendimento();
	romae.addMaisEspecialidade();
	romae.addMaisPremio();
});


$( window ).resize(function() {
	romae.iobtn();
});