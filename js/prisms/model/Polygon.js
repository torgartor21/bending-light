// Copyright 2015, University of Colorado Boulder

/**
 * Shape that comprises a prism. Immutable here but composed with a Property.<Polygon> in Prism for mutability.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chandrashekar Bemagoni (Actual Concepts)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Vector2 = require( 'DOT/Vector2' );
  var Shape = require( 'KITE/Shape' );
  var Line = require( 'KITE/segments/Line' );
  var Arc = require( 'KITE/segments/Arc' );
  var PrismIntersection = require( 'BENDING_LIGHT/prisms/model/PrismIntersection' );

  /**
   * @param {number} referencePointIndex - index of reference point
   * @param {array.<Vector2>} points - array of corner points
   * @param {number} radius - radius is 0 for polygon or radius for diverging lens
   * @constructor
   */
  function Polygon( referencePointIndex, points, radius ) {

    this.points = points; // @private

    // Index for the point used as the "reference" point, which is used as the drag handle corner for rotation
    this.referencePointIndex = referencePointIndex; // @private
    this.radius = radius; // @private

    // @public (read-only), Centroid of the shape
    this.centroid = this.getCentroid( this.points );

    // Creates a shape
    this.shape = new Shape(); // @public (read-only)
    this.center = null; // @public (read-only)

    // radius is 0 for polygon
    if ( this.radius === 0 ) {
      this.shape.moveToPoint( this.points[ 0 ] );
      for ( var i = 1; i < this.points.length; i++ ) {
        this.shape.lineToPoint( this.points[ i ] );
      }
      this.shape.close();
    }
    else {

      // radius is nonzero for diverging lens
      this.center = this.points[ 0 ].plus( this.points[ 3 ] ).multiplyScalar( 0.5 );
      var startAngle = Math.atan2( this.center.y - this.points[ 3 ].y, this.center.x - this.points[ 3 ].x );
      this.shape.ellipticalArcPoint( this.center, this.radius, this.radius, 0, startAngle, startAngle + Math.PI, true )
        .lineToPoint( this.points[ 2 ] )
        .lineToPoint( this.points[ 1 ] )
        .lineToPoint( this.points[ 0 ] );
    }
  }

  return inherit( Object, Polygon, {

    /**
     * Get the specified corner point
     * @public
     * @param {number} i - index of point
     * @returns {Vector2}
     */
    getPoint: function( i ) {
      return this.points[ i ];
    },

    /**
     * Create a new Polygon translated by the specified amount
     * @public
     * @param {number} deltaX - distance in x direction to be translated
     * @param {number} deltaY - distance in y direction to be translated
     * @returns {Polygon}
     */
    getTranslatedInstance: function( deltaX, deltaY ) {

      var newPoints = [];
      for ( var j = 0; j < this.points.length; j++ ) {

        // get the new points after translating
        newPoints.push( this.points[ j ].plusXY( deltaX, deltaY ) );
      }

      // create a new polygon with translated points
      return new Polygon( this.referencePointIndex, newPoints, this.radius );
    },

    /**
     * Gets a rotated copy of this polygon
     * @public
     * @param {number} angle - angle to be rotated
     * @param {Vector2} rotationPoint - point around which polygon to be rotated
     * @returns {Polygon}
     */
    getRotatedInstance: function( angle, rotationPoint ) {
      var newPoints = [];
      for ( var k = 0; k < this.points.length; k++ ) {
        var vectorAboutCentroid = this.points[ k ].subtract( rotationPoint );
        var rotated = vectorAboutCentroid.rotate( angle );

        // get the new points after rotating
        newPoints.push( rotated.add( rotationPoint ) );
      }

      // create a new polygon with rotated points
      return new Polygon( this.referencePointIndex, newPoints, this.radius );
    },

    /**
     * Determines whether shape contains given point or not
     * @public
     * @param {Vector2} point
     * @returns {boolean}
     */
    containsPoint: function( point ) {
      return this.shape.containsPoint( point );
    },

    /**
     * Just use the 0th point for the reference point for rotation drag handles
     * @public
     * @returns {Vector2}
     */
    getReferencePoint: function() {
      return this.getPoint( this.referencePointIndex );
    },

    /**
     * Computes the centroid of the corner points (e.g. the center of "mass" assuming the corner points have equal
     * "mass")
     * @public
     * @returns {Vector2}
     */
    getRotationCenter: function() {
      return this.centroid;
    },

    /**
     * Centroid of the polygon
     * @public
     * @param {array.<Vector2>} p - array of corner points
     * @returns {Vector2}
     */
    getCentroid: function( p ) {
      var cx = 0;
      var cy = 0;
      for ( var i = 0; i < p.length; i++ ) {
        var j = ( i + 1 ) % p.length;
        var n = ( ( p[ i ].x * p[ j ].y ) - ( p[ j ].x * p[ i ].y ) );
        cx += ( p[ i ].x + p[ j ].x ) * n;
        cy += ( p[ i ].y + p[ j ].y ) * n;
      }
      var a = this.getArea( p );
      var f = 1 / ( a * 6);
      cx *= f;
      cy *= f;
      return new Vector2( cx, cy );
    },

    /**
     * Computes the area of a polygon using the algorithm described at http://www.mathopenref.com/coordpolygonarea2.html
     * Used to compute the centroid for a lens so it can be rotated about its center.
     * @private
     * @param {array<Vector2>} p - array of corner points
     * @returns {number}
     */
    getArea: function( p ) {
      var a = 0;
      for ( var i = 0; i < p.length; i++ ) {
        var j = ( i + 1 ) % p.length;
        a += ( p[ i ].x * p[ j ].y );
        a -= ( p[ j ].x * p[ i ].y );
      }
      a *= 0.5;
      return a;
    },

    /**
     * Compute the intersections of the specified ray with this polygon's edges
     * @public
     * @param {ColoredRay} ray - model of the ray
     * @returns {Array}
     */
    getIntersections: function( ray ) {
      var arc = null;
      if ( this.radius !== 0 ) {
        var startAngle = Math.atan2( this.center.y - this.points[ 3 ].y, this.center.x - this.points[ 3 ].x );
        arc = new Arc( this.center, this.radius, startAngle, startAngle + Math.PI, true );
      }
      return PrismIntersection.getIntersections( this.getEdges(), arc, this.center, ray );
    },

    /**
     * List all bounding edges in the polygon
     * @private
     * @returns {Array}
     */
    getEdges: function() {
      var lineSegments = [];
      for ( var i = 0; i < this.points.length - 1; i++ ) {
        lineSegments.push( new Line( this.points[ i ], this.points[ i + 1 ] ) );
      }
      if ( this.radius === 0 ) {
        lineSegments.push( new Line( this.points[ this.points.length - 1 ], this.points[ 0 ] ) );
      }
      return lineSegments;
    }
  } );
} );