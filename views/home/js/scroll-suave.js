$(function() {
    $('a[href*="#"]').on('click',function (e) {
        console.log("clicado");
        var target = this.hash;
        var $target = $(target);

        if ( $target.length ) {
            e.preventDefault();
            $('html, body').stop().animate({
                 'scrollTop': $target.offset().top - 70
            }, 900, 'swing');
        }
    });
});
