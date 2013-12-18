;(function(){
	var idle = function(map, name, args){
			google.maps.event.addListenerOnce(map, idle, function(){
				map[name].apply(map, args);
			})
		},
		//Calculate the distance of a pixel
		getPxFactor = function(map) {
            var node = map.getDiv(),
            	width = node.offsetWidth,
                height = node.offsetHeight,
                bounds = map.getBounds(),
                ne = bounds.getNorthEast(),
                sw = bounds.getSouthWest(),
                lat = ne.lat() - sw.lat(),
                lng = ne.lng() - sw.lng();
            return {
                left: lng / width,
                top: lat / height
            };
        },
        //Shift a point
		shiftPoint = function(map, latlng){
			var factor = getPxFactor(map),
                pxShift = {
                    left: (map.shift.right - map.shift.left) / 2 || 0,
                    top: (map.shift.top - map.shift.bottom) / 2 || 0
                },
                shifted = {
                    left: pxShift.left * factor.left + latlng.lng(),
                    top: pxShift.top * factor.top + latlng.lat()
                };

            return new google.maps.LatLng(shifted.top, shifted.left);
		},
		//Shift bounds
		translateBounds = function(map, bounds) {
            var factor = getPxFactor(map),
                bne = bounds.getNorthEast(),
                bsw = bounds.getSouthWest(),
                ne = {
                    lat: bne.lat() - map.shift.top * factor.top,
                    lng: bne.lng() + map.shift.right * factor.left
                },
                sw = {
                    lat: bsw.lat() + map.shift.bottom * factor.top,
                    lng: bsw.lng() - map.shift.left * factor.left
                };
            return new google.maps.LatLngBounds(
                new google.maps.LatLng(sw.lat, sw.lng),
                new google.maps.LatLng(ne.lat, ne.lng)
            );
        },

        /**
         * Add shifted methods to a existing map
         * @param  {google.maps.Map} map   The map object
         * @param  {Object} shift The map padding to calculate the new center or bounds {top,right,bottom,left}
         * @return {ShiftedMap}       A google map with the shifted methods
         */
        shiftMap = function(map, shift){
			map.shift = shift || {top: 0, right: 0, bottom:0, left:0};

			//Add shifted methods
			map.getShiftedCenter = function() {
		        if (!this.getBounds())
		            return idle(map, 'getShiftedCenter', []);
		        return shiftPoint(map, this.getCenter());
		    };

		    map.setShiftedCenter = function(latlng) {
		        if (!this.getBounds())
		            return idle(map, 'setShiftedCenter', [latlng]);
		        return this.setCenter(shiftPoint(map, latlng));
		    };
		    map.panToShifted = function(latlng) {
		        if (!this.getBounds())
		            return idle(map, 'panToShifted', [latlng]);
		        return this.panTo(shiftPoint(map, latlng));
		    };
		    map.fitBoundsShifted = function(bounds) {
		        if (!this.getBounds())
		            return idle(map, 'fitBoundsShifted', [bounds]);
		        return this.fitBounds(shiftBounds(map, bounds));
		    };

		    return map;
		},
		/**
		 * Create a new google map with the shifted methods
		 * @param  {HTMLNode} node    The node to create the map
		 * @param  {google.map.MapOptions} options Usual google map options plus shift:{top,right,bottom,left}
		 * @return {google.maps.Map}         A google map with the shifted methods
		 */
		createShiftedMap = function(node, options){
			var map = new google.maps.Map(node, options),
				shift = options.shift || {top: 0, right: 0, bottom:0, left:0}
			;
			return shiftMap(map, shift);
		}		
	;

	window.ShiftedMap = {
		shift: shiftMap,
		create: createShiftedMap
	};
})();