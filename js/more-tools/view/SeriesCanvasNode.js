// Copyright 2002-2015, University of Colorado Boulder

/**
 * Node for drawing the series of points.
 *
 * @author Chandrashekar Bemagoni (Actual Concepts)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var CanvasNode = require( 'SCENERY/nodes/CanvasNode' );

  /**
   *
   * @param {ObservableArray<DataPoint>} seriesPoints
   * @param {string} color - color of the series
   * @param {Object} [options] - options that can be passed on to the underlying node
   * @constructor
   */
  function SeriesCanvasNode( seriesPoints, color, options ) {

    CanvasNode.call( this, options );
    this.seriesPoints = seriesPoints;
    this.color = color;
  }

  return inherit( CanvasNode, SeriesCanvasNode, {

    /**
     * Paints the  series points on the canvas node.
     * @protected
     * @param {CanvasContextWrapper} wrapper
     */
    paintCanvas: function( wrapper ) {
      var context = wrapper.context;
      var moved = false;

      context.beginPath();
      for ( var i = 0; i < this.seriesPoints.length; i++ ) {
        var dataPoint = this.seriesPoints.get( i );
        if ( dataPoint ) {
          if ( !moved ) {
            context.moveTo( dataPoint[ 0 ], dataPoint[ 1 ] );
            moved = true;
          }
          else {
            context.lineTo( dataPoint[ 0 ], dataPoint[ 1 ] );
          }
        }
      }
      context.strokeStyle = this.color;
      context.lineWidth = 2;
      context.setLineDash( [] );
      context.lineDashOffset = 0;
      context.stroke();
      context.closePath();
    },

    /**
     * @public
     */
    step: function() {
      this.invalidatePaint();
    }

  } );
} );