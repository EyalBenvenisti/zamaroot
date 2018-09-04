//Initialize our swiper slider
var swiper = new Swiper('.swiper-container', {
    spaceBetween: 0, //we don't need space between sliders
    centeredSlides: true,
    autoplay: 10000,
    autoplayDisableOnInteraction: false
});

//
$("body").ready(function _onbodyready() {
    $(".default")
        .pullToRefresh();

    $(".refresh")
        .pullToRefresh({
            refresh: 40
        })
    $(".p2r")
        .on("refresh.pulltorefresh", function (e, p) {
            window.location.reload();
        })
        .on("end.pulltorefresh", function () {
            window.location.reload();
        })
});

//Add background picture movement for mouse move action and load dynamic data
$(document).ready(function() {
    var movementStrength = 15;
    var height = movementStrength / $(window).height();
    var width = movementStrength / $(window).width();
    $(".swiper-slide").mousemove(function(e){
        var pageX = e.pageX - ($(window).width() / 2);
        var pageY = e.pageY - ($(window).height() / 2);
        var newvalueX = width * pageX * -1 - 25;
        var newvalueY = height * pageY * -1 - 50;
        $('.swiper-slide').css("background-position", newvalueX+"px     "+newvalueY+"px");
    });
});