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
		$('#menu').click(function() {
			$('#menu-menu').slideToggle('slow');
		});
		
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
		$('.gallery-photos__pht').fancybox();
		
		$(".gallery-photos__vid").fancybox();
	},
	accordion: function(){
		$('#accordion').find('.accordion-toggle').click(function(){
			$(this).next().slideToggle('fast');
			$(".accordion-content").not($(this).next()).slideUp('fast');
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
});