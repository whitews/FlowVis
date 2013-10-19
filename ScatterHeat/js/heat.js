/*
 * Copyright (c) 2013, Scott White
 * heat.js is based on heatmap.js, basically a refactoring of that code
 * to make a very simple version that is easier to maintain.
 *
 * Copyright (c) 2011, Patrick Wied (http://www.patrick-wied.at)
 *
 * Dual-licensed under the MIT (www.opensource.org/licenses/mit-license.php)
 * and the Beerware (en.wikipedia.org/wiki/Beerware) license.
 */

heat = function() {
    var heat = {};

    var default_gradient = {
        0.00: "powderblue",
        0.25: "blue",
        0.45: "lime",
        0.60: "yellow",
        0.75: "orange",
        0.85: "coral",
        0.90: "red",
        0.95: "maroon",
        0.98: "rgb(64,0,0)",
        1.00: "black"
    };

    var heat_map = function heat_map(config) {
        this.radius = config.radius || 5;
        this.gradient = config.gradient || default_gradient;
        this.opacity = config.opacity || 180;
        this.canvas = config.canvas;

        var translate = config.translate || [0,0];
        var ctx = this.canvas.getContext("2d");
        var orig_width = this.canvas.width;
        var orig_height = this.canvas.height;

        this.canvas.width = 1;
        this.canvas.height = 256;
        var grad = ctx.createLinearGradient(0,0,1,256);

        for(var x in this.gradient) {
            if (this.gradient.hasOwnProperty(x)) {
                grad.addColorStop(Number(x), this.gradient[x]);
            }
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0,0,1,256);

        this.gradient = ctx.getImageData(0,0,1,256).data;

        this.canvas.width = orig_width;
        this.canvas.height = orig_height;

        // Have to re-apply any transformation here
        ctx.translate(translate[0], translate[1]);

        this.set_data = function set_data(obj) {
            var ctx = this.canvas.getContext("2d");
            ctx.shadowColor = ('rgba(0,0,0,0.1)');
            ctx.shadowOffsetX = 15000;
            ctx.shadowOffsetY = 15000;
            ctx.shadowBlur = 15;

            var len = obj.length;
            while (len--) {
                var point = obj[len];
                ctx.beginPath();
                ctx.arc(
                    point.x - 15000,
                    point.y - 15000,
                    this.radius, 0,
                    Math.PI*2,
                    true);
                ctx.closePath();
                ctx.fill();
            }
        };

        this.colorize = function colorize() {
            var ctx = this.canvas.getContext("2d");
            var image = ctx.getImageData(
                0,
                0,
                this.canvas.width,
                this.canvas.height);
            var alpha, offset, finalAlpha;

            for(var i=0; i < image.data.length; i+=4){

                // [0] -> r, [1] -> g, [2] -> b, [3] -> alpha
                alpha = image.data[i+3];
                offset = alpha*4;

                if (!offset)
                    continue;

                image.data[i] = this.gradient[offset];
                image.data[i+1] = this.gradient[offset+1];
                image.data[i+2] = this.gradient[offset+2];

                finalAlpha = (alpha < this.opacity) ? alpha : this.opacity;
                image.data[i+3] = finalAlpha;
            }
            ctx.putImageData(image, 0, 0);
        };
        return this;
    };

    heat.create = function(config) {
        return new heat_map(config);
    };

    return heat;
}();