(function() {
    var canvas = document.getElementById('canvas');
    var container = document.getElementById('container');
    sizing();
    function sizing() {
        canvas.height = container.offsetHeight;
        canvas.width = container.offsetWidth;
    }
    window.addEventListener('resize', function() {(!window.requestAnimationFrame) ? setTimeout(sizing, 300): window.requestAnimationFrame(sizing);});
})();