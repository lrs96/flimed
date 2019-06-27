$(document).ready(function() {
    $('#cliente-cadastro').on('submit', function(e) {
        e.preventDefault()
        
        $.ajax({
            type: 'POST',
            url: '/cliente-cadastro',
            datatype: 'html',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            data: $('#cliente-cadastro').serialize(),
            success: function(result) {          
                alertify.notify(result, 'success', 5)
                setTimeout(function() { 
                    window.location.href = '/login'
                }, 500)
            },
            error : function(xhr, status, error) {
                alertify.notify(JSON.parse(xhr.responseText), 'error', 5)
            },
        })
    })
})