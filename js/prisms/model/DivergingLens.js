// Copyright 2002-2015, University of Colorado Boulder

/**
 * Shape that comprises a prism.
 *
 * @author Chandrashekar Bemagoni (Actual Concepts)
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Vector2 = require( 'DOT/Vector2' );
  var Shape = require( 'KITE/Shape' );
  var Line = require( 'KITE/segments/Line' );
  var Arc = require( 'KITE/segments/Arc' );
  var Ray2 = require( 'DOT/Ray2' );
  var Intersection = require( 'BENDING_LIGHT/prisms/model/Intersection' );

  /**
   *
   * @param {number} referencePointIndex - index of reference point
   * @param {array.<Vector2>} points - array of corner points
   * @param {number} radius - radius of diverging lens
   * @constructor
   */
  function DivergingLens( referencePointIndex, points, radius ) {

    this.points = points;
    // index for the point used as the "reference" point,
    // which is used as the drag handle corner for rotation
    this.referencePointIndex = referencePointIndex;
    this.radius = radius;
    this.centroid = this.getCentroid( this.points );
    this.center = this.points[ 0 ].plus( this.points[ 3 ] ).multiplyScalar( 0.5 );
  }

  return inherit( Object, DivergingLens, {

    /**
     * Creates a shape
     * @public
     * @returns {Shape}
     */
    toShape: function() {
      var startAngle = Math.atan2( this.center.y - this.points[ 3 ].y, this.center.x - this.points[ 3 ].x );
      return new Shape()
        .ellipticalArcPoint( this.center, this.radius, this.radius, 0, startAngle, startAngle + Math.PI, true )
        .lineToPoint( this.points[ 2 ] )
        .lineToPoint( this.points[ 1 ] )
        .lineToPoint( this.points[ 0 ] );
    },

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
     * Create a new DivergingLens translated by the specified amount
     * @public
     * @param {number} deltaX - x coordinate to be translated
     * @param {number} deltaY - y coordinate to be translated
     * @returns {DivergingLens}
     */
    getTranslatedInstance: function( deltaX, deltaY ) {

      var newPoints = [];
      for ( var j = 0; j < this.points.length; j++ ) {
        newPoints.push( this.points[ j ].plusXY( deltaX, deltaY ) );
      }
      return new DivergingLens( this.referencePointIndex, newPoints, this.radius );
    },

    /**
     * Gets a rotated copy of this DivergingLens
     * @public
     * @param {number} angle - angle to be rotated
     * @param {Vector2} rotationPoint - point around which DivergingLens to be rotated
     * @returns {DivergingLens}
     */
    getRotatedInstance: function( angle, rotationPoint ) {
      var newPoints = [];
      for ( var k = 0; k < this.points.length; k++ ) {
        var vectorAboutCentroid = this.points[ k ].subtract( rotationPoint );
        var rotated = vectorAboutCentroid.rotate( angle );
        newPoints.push( rotated.add( rotationPoint ) );
      }
      return new DivergingLens( this.referencePointIndex, newPoints, this.radius );
    },

    /**
     * Determines whether shape contains given point or not
     * @public
     * @param {Vector2} point
     * @returns {boolean}
     */
    containsPoint: function( point ) {
      return this.toShape().containsPoint( point );
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
     * Centroid of the rectangle formed by the corner points
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
     * Area of the rectangle formed by the corner points
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
     * @param {Ray} ray - model of the ray
     * @returns {Array}
     */
    getIntersections: function( ray ) {
      var intersections = [];
      this.getEdges().forEach( function( lineSegment ) {
        // Get the intersection if there is one
        var intersection = lineSegment.intersection( new Ray2( ray.tail, ray.directionUnitVector ) );
        if ( intersection.length !== 0 ) {
          // Choose the normal vector that points the opposite direction of the incoming ray
          var normal = lineSegment.getEnd().minus( lineSegment.getStart() ).rotate( +Math.PI / 2 ).normalize();
          var unitNormal = ray.directionUnitVector.dot( normal ) < 0 ? normal : normal.rotate( Math.PI );

          // Add to the list of intersections
          intersections.push( new Intersection( unitNormal, intersection[ 0 ].point ) );
        }
      } );
      var startAngle = Math.atan2( this.center.y - this.points[ 3 ].y, this.center.x - this.points[ 3 ].x );
      var arc = new Arc( this.center, this.radius, startAngle, startAngle + Math.PI, true );
      var intersection = arc.intersection( new Ray2( ray.tail, ray.directionUnitVector ) );
      if ( intersection.length !== 0 ) {
        // Only consider intersections that are in front of the ray
        if ( ((intersection[ 0 ].point.x - ray.tail.x) * ray.directionUnitVector.x +
              (intersection[ 0 ].point.y - ray.tail.y) * ray.directionUnitVector.y) > 0 ) {
          var normalVector = intersection[ 0 ].point.minus( this.center ).normalize();
          if ( normalVector.dot( ray.directionUnitVector ) > 0 ) {
            normalVector.negate();
          }
          intersections.push( new Intersection( normalVector, intersection[ 0 ].point ) );
        }
      }
      return intersections;
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
      return lineSegments;
    }
  } );
} );