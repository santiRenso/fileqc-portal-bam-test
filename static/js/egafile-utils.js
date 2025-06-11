window.ega_number_format = function(n, sep){

    var s = String(n);
    //console.log('Formatting: '+ s);
    var len = s.length;
    var prefix = len % 3;

    var res = []
    if(prefix > 0){ res.push(s.slice(0,prefix)); }
    for( var i=prefix; i < s.length; i+=3){ res.push(s.slice(i,i+3)); }

    return res.join((sep === undefined)?' ':sep);
}


// Click/Toggle info banner for the graph
$( "#data section .trigger" ).click(function() {
    $( this ).parent('section').toggleClass( "open" );
});

// Click/Toggle more-lists
$( "#info" ).on( "click", "li .more-trigger", function() {
    $( this ).parent('li').toggleClass( "open" );
});

$( ".popup-trigger" ).click(function() {
    const name = $( this ).attr('name');
    const popup = $(`.popup[name='${name}']`)[0];
    popup.showModal();
});
$( ".popup" ).click(function(e) {
    const name = e.target.closest("button")?.name;
    const popup = $(this)[0];
    if(name === 'close')
        popup.close();
});
$(document).on('click',function(e){
    if((e.target.closest(".popup-window") ) || e.target.closest(".popup-trigger"))
        return;
    const open_popup = $(".popup[open]")[0];
    if(open_popup) open_popup.close();
});
(function(){
    var $info = $("#info");
    var url = $info.attr('data-url');
    $.get( url, function( data ) { $info.append(data); });
})();
