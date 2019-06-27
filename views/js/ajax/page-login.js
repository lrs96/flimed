$(document).ready(function() {
    $('#page-login').on('submit', function(e) {
        e.preventDefault()
        
        $.ajax({
            type: 'POST',
            url: '/login',
            datatype: 'html',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            data: $('#page-login').serialize(),
            success: function() {          
                window.location.href = '/validate'
            },
            error : function(xhr, status, error) {
                alertify.notify(JSON.parse(xhr.responseText), 'error', 5)
            },
        })
    })
})