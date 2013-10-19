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
        0.45: "rgb(0,0,255)",
        0.55: "rgb(0,255,255)",
        0.65: "rgb(0,255,0)",
        0.95: "yellow",
        1.0: "rgb(255,0,0)"
    };

    var heat_map = function heat_map(config) {
        var _ = {};

        this.get = function(key){
            return _[key];
        };
        this.set = function(key, value){
            _[key] = value;
        };
        this.configure(config);
        this.init();
    };

    heat_map.prototype = {
        configure: function(config){
            var me = this;
            me.set("radius", config.radius || 40);
            me.set("gradient", config.gradient || default_gradient);
            me.set("opacity", config.opacity || 180);
            me.set("canvas", config.canvas);
            me.set("translate", config.translate || [0,0]);
        },
        init: function(){
            var me = this;
            var canvas = me.get("canvas");
            var ctx = canvas.getContext("2d");
            var translate = me.get("translate");

            var gradient = me.get("gradient");

            var orig_width = canvas.width;
            var orig_height = canvas.height;

            canvas.width = "1";
            canvas.height = "256";
            var grad = ctx.createLinearGradient(0,0,1,256);

            for(var x in gradient){
                grad.addColorStop(x, gradient[x]);
            }

            ctx.fillStyle = grad;
            ctx.fillRect(0,0,1,256);

            me.set("gradient", ctx.getImageData(0,0,1,256).data);

            canvas.width = orig_width;
            canvas.height = orig_height;

            // Have to re-apply any transformation here
            ctx.translate(translate[0], translate[1]);
        },
        setDataSet: function(obj) {
            var me = this,
                d = obj.data,
                dlen = d.length;

            while (dlen--) {
                var point = d[dlen];
                me.drawAlpha(point.x, point.y);
            }
            me.colorize();
        },
        colorize: function() {
            var me = this;
            var canvas = me.get("canvas");
            var ctx = canvas.getContext("2d");
            var palette = me.get("gradient");
            var opacity = me.get("opacity");
            var image = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var alpha, offset, finalAlpha;

            for(var i=0; i < image.data.length; i+=4){

                // [0] -> r, [1] -> g, [2] -> b, [3] -> alpha
                alpha = image.data[i+3];
                offset = alpha*4;

                if (!offset)
                    continue;

                image.data[i] = palette[offset];
                image.data[i+1] = palette[offset+1];
                image.data[i+2] = palette[offset+2];

                finalAlpha = (alpha < opacity) ? alpha : opacity;
                image.data[i+3] = finalAlpha;
            }
            ctx.putImageData(image, 0, 0);
        },
        drawAlpha: function(x, y){
            var me = this;
            var canvas = me.get("canvas");
            var ctx = canvas.getContext("2d");
            var radius = me.get("radius");

            ctx.shadowColor = ('rgba(0,0,0,0.1)');

            ctx.shadowOffsetX = 15000;
            ctx.shadowOffsetY = 15000;
            ctx.shadowBlur = 15;

            ctx.beginPath();
            ctx.arc(x - 15000, y - 15000, radius, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.fill();
        }
    };

    heat.create = function(config) {
        return new heat_map(config);
    };

    return heat;
}();