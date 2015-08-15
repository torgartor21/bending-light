// Copyright 2002-2015, University of Colorado Boulder

/**
 * This CanvasNode renders the light rays for the non-white rays.  It is used only when WebGL is not available.
 *
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var CanvasNode = require( 'SCENERY/nodes/CanvasNode' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Util = require( 'DOT/Util' );

  /**
   * @param {ModelViewTransform2} modelViewTransform - converts between model and view co-ordinates
   * @param {number} stageWidth - width of the dev area
   * @param {number} stageHeight - height of the dev area
   * @param {ObservableArray.<LightRay>} rays -
   * @constructor
   */
  function SingleColorLightCanvasNode( modelViewTransform, stageWidth, stageHeight, rays ) {

    CanvasNode.call( this, {
      canvasBounds: new Bounds2( 0, 0, stageWidth, stageHeight )
    } );
    this.modelViewTransform = modelViewTransform; // @private
    this.stageHeight = stageHeight; // @private
    this.stageWidth = stageWidth; // @private

    this.rays = rays;
    this.invalidatePaint();

    // TODO: factor 
    this.strokeWidth = this.modelViewTransform.modelToViewDeltaX( 1.5992063492063494E-7 );
  }

  return inherit( CanvasNode, SingleColorLightCanvasNode, {

    /**
     * Paints the particles on the canvas node.
     * @protected
     * @param {CanvasContextWrapper} wrapper
     */
    paintCanvas: function( wrapper ) {
      var context = wrapper.context;

      context.lineWidth = this.strokeWidth;
      for ( var i = 0; i < this.rays.length; i++ ) {
        context.beginPath();
        var ray = this.rays.get( i );
        context.strokeStyle = 'rgba(' + ray.color.getRed() + ',' + ray.color.getGreen() + ',' + ray.color.getBlue() + ',' + Math.sqrt( ray.powerFraction ) + ')';

        context.moveTo(
          this.modelViewTransform.modelToViewX( ray.tail.x ),
          this.modelViewTransform.modelToViewY( ray.tail.y )
        );

        context.lineTo(
          this.modelViewTransform.modelToViewX( ray.tip.x ),
          this.modelViewTransform.modelToViewY( ray.tip.y )
        );
        context.stroke();
      }
    },

    step: function() {
      this.invalidatePaint();
    }
  } );
} );