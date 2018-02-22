// jQuery Flicker
//
// Causes an element to flicker like an old lightbulb
// Version 0.3, July 5th, 2012
//
// by Nate Hunzaker
// --------------------------------------------------------- //

(function($) {

    "use strict";

    $.fn.flicker = function(method) {

		// Default Values
		// ----------------------------------- //

		this.defaults = {
		    minOpacity: 0.7,
		    maxOpacity: 1,
		    transition: 200,
		    delay: 75,
		    probability: 0.1
		};

        // Public Methods
        // ----------------------------------- //

        var methods = {

            init : function(options) {

                var settings = $.extend({}, this.defaults, options);

                return this.each(function() {

                    var $element = $(this), // reference to the jQuery version of the current DOM element
                         element = this;    // reference to the actual DOM element

                    $element.data("flicker", $.extend({}, settings, {
                        active: true
                    }));

                    methods.flick($element);

                });

            },

            // Handle hollogram projection
            // A recursive function to simulate a flickering effect
            flick: function flick ($target) {

                var o     = $target.data("flicker"),
                    probability = Math.random(),
                    transition  = (Math.random() * 0.4 * o.transition - 0.2 * o.transition) + o.transition,
                    delay       = (Math.random() * 0.6 * o.delay - 0.3 * o.delay) + o.delay,
                    flash       = Math.random() * (o.maxOpacity - o.minOpacity) + o.minOpacity;

                // If the 'continue' property of deliberatly set to false, exit
                if ($target.data("flicker").active === false) {
                    return false;
                }

                if (o.probability === 0 || (probability > o.probability && $target.data("flicker").once)) {
                    setTimeout(function() {
                        flick($target);
                    }, delay);

                } else {

                    $target.data("flicker").once = true;
                    $target.animate({ opacity: flash }, transition)
                           .delay(delay)
                           .animate({ opacity: 1 }, transition, function() {

                        flick($target);

                    });
                }

            },

            stop: function() {
                this.each(function() {
                    $(this).data("flicker").active = false;
                    $(this).data("flicker").once = undefined;
                });
            }

        };

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error( 'Method "' +  method + '" does not exist in the flicker plugin!');
        }

    };

})(window.jQuery);