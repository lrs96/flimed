$(document).ready(function() {
    $('#pesquisa-avancada').on('submit', function(e) {
        e.preventDefault()
        
        $.ajax({
            type: 'POST',
            url: '/pesquisa-avancada',
            datatype: 'html',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            data: 'clinica' + $('#clinica').html() + $('#pesquisa-avancada').serialize(),
            success: function() { 
                alertify.notify('Sucesso!', 'error', 5)
            },
            error : function(xhr, status, error) {
                alertify.notify(JSON.parse(xhr.responseText), 'error', 5)
            },
        })
    })
})