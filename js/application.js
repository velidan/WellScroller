(function (root) {


        wellScroller(document.querySelector('.vertical'), {
            marginTop : true,

        });

    wellScroller(document.querySelector('.scrollDownBtn'), {
        scrollDownBtn : document.querySelector('.scrollDown')
    });

        wellScroller(document.querySelector('.horizontal'), {
            axis : 'x'
        });
}(window));
