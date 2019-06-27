const target = document.querySelectorAll("[data-anime]");
const animmationClass = 'animate';

function animeScroll() {
	const windowTop = window.pageYOffset + ((window.innerHeight * 3) / 4);
	target.forEach(function(element){
		if((windowTop) > element.offsetTop ){
		   element.classList.add(animmationClass);
		   } else {
			   element.classList.remove(animmationClass);
		   }
		
		console.log(element.offsetTop);
	})
}

animeScroll()


if(target.length) {
	window.addEventListener('scroll', function() {
		animeScroll();
	});
}
