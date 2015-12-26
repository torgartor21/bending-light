// Copyright 2015, University of Colorado Boulder

/**
 * Model for the "prisms" screen, in which the user can move the laser and many prisms.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chandrashekar Bemagoni (Actual Concepts)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var BendingLightModel = require( 'BENDING_LIGHT/common/model/BendingLightModel' );
  var ObservableArray = require( 'AXON/ObservableArray' );
  var Circle = require( 'BENDING_LIGHT/prisms/model/Circle' );
  var SemiCircle = require( 'BENDING_LIGHT/prisms/model/SemiCircle' );
  var Polygon = require( 'BENDING_LIGHT/prisms/model/Polygon' );
  var ColoredRay = require( 'BENDING_LIGHT/prisms/model/ColoredRay' );
  var Ray2 = require( 'DOT/Ray2' );
  var Property = require( 'AXON/Property' );
  var Util = require( 'DOT/Util' );
  var LightRay = require( 'BENDING_LIGHT/common/model/LightRay' );
  var Medium = require( 'BENDING_LIGHT/common/model/Medium' );
  var Prism = require( 'BENDING_LIGHT/prisms/model/Prism' );
  var Vector2 = require( 'DOT/Vector2' );
  var Shape = require( 'KITE/Shape' );
  var VisibleColor = require( 'SCENERY_PHET/VisibleColor' );
  var Color = require( 'SCENERY/util/Color' );
  var BendingLightConstants = require( 'BENDING_LIGHT/common/BendingLightConstants' );
  var Substance = require( 'BENDING_LIGHT/common/model/Substance' );
  var MediumColorFactory = require( 'BENDING_LIGHT/common/model/MediumColorFactory' );

  // constants
  var WAVELENGTH_RED = BendingLightConstants.WAVELENGTH_RED;
  var CHARACTERISTIC_LENGTH = WAVELENGTH_RED;

  /**
   * @constructor
   */
  function PrismsModel() {

    this.prisms = new ObservableArray(); // @public (read-only)

    // @public (read-only) - List of intersections, which can be shown graphically
    this.intersections = new ObservableArray();

    this.mediumColorFactory = new MediumColorFactory();
    var prismsModel = this;
    BendingLightModel.call( this,
      Math.PI,
      false,
      1E-16, {

        // Show multiple beams to help show how lenses work
        manyRays: 1,

        // If false, will hide non TIR reflections
        showReflections: false,
        showNormals: false,
        showProtractor: false, // @public

        // Environment the laser is in
        environmentMedium: new Medium( Shape.rect( -1, 0, 2, 1 ), Substance.AIR,
          this.mediumColorFactory.getColor( Substance.AIR.indexOfRefractionForRedLight ) ),

        // Material that comprises the prisms
        prismMedium: new Medium( Shape.rect( -1, -1, 2, 1 ), Substance.GLASS,
          this.mediumColorFactory.getColor( Substance.GLASS.indexOfRefractionForRedLight ) ),

        intersectionStroke: 'black'
      } );

    this.laser.colorModeProperty.link( function( colorMode ) {
      prismsModel.intersectionStroke = colorMode === 'white' ? 'white' : 'black';
    } );
    Property.multilink( [
      this.manyRaysProperty,
      this.environmentMediumProperty,
      this.showReflectionsProperty,
      this.prismMediumProperty,
      this.laser.onProperty,
      this.laser.pivotProperty,
      this.laser.emissionPointProperty,
      this.showNormalsProperty,
      this.laser.colorModeProperty,
      this.laser.colorProperty,
      this.laserViewProperty
    ], function() {
      prismsModel.clear();
      prismsModel.updateModel();
      prismsModel.dirty = true;
    } );

    // coalesce repeat updates so work is not duplicated in white light node.
    this.dirty = true; // @public

    // @public
    this.rotationArrowAngleOffset = 0;
  }

  return inherit( BendingLightModel, PrismsModel, {

    /**
     * @public
     * @override
     */
    reset: function() {
      BendingLightModel.prototype.reset.call( this );
      this.prisms.clear();
      this.manyRaysProperty.reset();
      this.environmentMediumProperty.reset();
      this.prismMediumProperty.reset();
      this.showReflectionsProperty.reset();
      this.showNormalsProperty.reset();
      this.showProtractorProperty.reset();
    },

    /**
     * List of prism prototypes that can be created in the sim
     * @public
     * @returns {Array}
     */
    getPrismPrototypes: function() {
      var prismsTypes = [];

      // characteristic length scale
      var a = CHARACTERISTIC_LENGTH * 10;

      // triangle, attach at bottom right
      prismsTypes.push( new Prism( new Polygon( 1, [
        new Vector2( -a / 2, -a / (2 * Math.sqrt( 3 )) ),
        new Vector2( a / 2, -a / (2 * Math.sqrt( 3 )) ),
        new Vector2( 0, a / Math.sqrt( 3 ) )
      ], 0 ), 'triangle' ) );

      // trapezoid, attach at bottom right
      prismsTypes.push( new Prism( new Polygon( 1, [
        new Vector2( -a / 2, -a * Math.sqrt( 3 ) / 4 ),
        new Vector2( a / 2, -a * Math.sqrt( 3 ) / 4 ),
        new Vector2( a / 4, a * Math.sqrt( 3 ) / 4 ),
        new Vector2( -a / 4, a * Math.sqrt( 3 ) / 4 )
      ], 0 ), 'trapezoid' ) );

      // attach at bottom right
      prismsTypes.push( new Prism( new Polygon( 2, [
        new Vector2( -a / 2, a / 2 ),
        new Vector2( a / 2, a / 2 ),
        new Vector2( a / 2, -a / 2 ),
        new Vector2( -a / 2, -a / 2 )
      ], 0 ), 'square' ) );

      var radius = a / 2;

      // Continuous Circle
      prismsTypes.push( new Prism( new Circle( new Vector2(), radius ), 'circle' ) );

      // SemiCircle
      prismsTypes.push( new Prism( new SemiCircle( 1, [
        new Vector2( 0, radius ),
        new Vector2( 0, -radius )
      ], radius ), 'semicircle' ) );

      // DivergingLens
      prismsTypes.push( new Prism( new Polygon( 2, [
        new Vector2( -0.6 * radius, radius ),
        new Vector2( 0.6 * radius, radius ),
        new Vector2( 0.6 * radius, -radius ),
        new Vector2( -0.6 * radius, -radius )
      ], radius ), 'diverging-lens' ) );
      return prismsTypes;
    },

    /**
     * Adds a prism to the model.
     * @public
     * @param {Prism} prism
     */
    addPrism: function( prism ) {
      this.prisms.add( prism );
    },

    /**
     * Removes a prism from the model
     * @public
     * @param {Prism} prism
     */
    removePrism: function( prism ) {
      this.prisms.remove( prism );
      this.updateModel();
    },

    /**
     * Determines whether white light or single color light
     * @private
     * @param {Ray2} ray - tail and direction for light
     * @param {number} power - amount of power this light has
     * @param {boolean} laserInPrism - specifies whether laser in prism
     */
    propagate: function( ray, power, laserInPrism ) {

      // Determines whether to use white light or single color light
      var mediumIndexOfRefraction;
      if ( this.laser.colorMode === 'white' ) {
        // This number is the number of (equally spaced wavelength) rays to show in a white beam. More rays looks
        // better but is more computationally intensive.
        var wavelengths = BendingLightConstants.WHITE_LIGHT_WAVELENGTHS;

        for ( var i = 0; i < wavelengths.length; i++ ) {
          var wavelength = wavelengths[ i ] / 1E9; // convert to meters
          mediumIndexOfRefraction = laserInPrism ?
                                    this.prismMedium.getIndexOfRefraction( wavelength ) :
                                    this.environmentMedium.getIndexOfRefraction( wavelength );

          // show the intersection for the smallest and largest wavelengths.  Protect against floating point error for
          // the latter
          var showIntersection = ( i === 0 ) || ( i === wavelengths.length - 1 );
          this.propagateTheRay( new ColoredRay( ray, power, wavelength, mediumIndexOfRefraction,
            BendingLightConstants.SPEED_OF_LIGHT / wavelength ), 0, showIntersection );
        }
      }
      else {
        mediumIndexOfRefraction = laserInPrism ?
                                  this.prismMedium.getIndexOfRefraction( this.laser.getWavelength() ) :
                                  this.environmentMedium.getIndexOfRefraction( this.laser.getWavelength() );
        this.propagateTheRay( new ColoredRay( ray, power, this.laser.getWavelength(),
          mediumIndexOfRefraction, this.laser.getFrequency() ), 0, true );
      }
    },

    /**
     * Algorithm that computes the trajectories of the rays throughout the system
     * @public
     */
    propagateRays: function() {

      if ( this.laser.on ) {
        var tail = this.laser.emissionPoint;
        var laserInPrism = this.isLaserInPrism();
        var directionUnitVector = this.laser.getDirectionUnitVector();
        if ( this.manyRays === 1 ) {

          // This can be used to show the main central ray
          this.propagate( new Ray2( tail, directionUnitVector ), 1.0, laserInPrism );
        }
        else {

          // Many parallel rays
          for ( var x = -WAVELENGTH_RED; x <= WAVELENGTH_RED * 1.1; x += WAVELENGTH_RED / 2 ) {
            var offset = directionUnitVector.rotated( Math.PI / 2 ).multiplyScalar( x );
            this.propagate( new Ray2( offset.add( tail ), directionUnitVector ), 1.0, laserInPrism );
          }
        }
      }
    },

    /**
     * Determine if the laser beam originates within a prism for purpose of determining what index of refraction to use
     * initially
     * @public
     * @returns {boolean}
     */
    isLaserInPrism: function() {
      var emissionPoint = this.laser.emissionPoint;
      for ( var i = 0; i < this.prisms.length; i++ ) {
        if ( this.prisms.get( i ).contains( emissionPoint ) ) {
          return true;
        }
      }
      return false;
    },

    /**
     * Recursive algorithm to compute the pattern of rays in the system. This is the main computation of this model,
     * rays are cleared beforehand and this algorithm adds them as it goes
     * @private
     * @param {ColoredRay} incidentRay - model of the ray
     * @param {number} count - number of rays
     * @param {boolean} showIntersection - true if the intersection should be shown.  True for single rays and for
     *                                     extrema of white light wavelengths
     */
    propagateTheRay: function( incidentRay, count, showIntersection ) {
      var rayColor;
      var rayVisibleColor;
      var waveWidth = CHARACTERISTIC_LENGTH * 5;

      // Termination condition: we have reached too many iterations or if the ray is very weak
      if ( count > 50 || incidentRay.power < 0.001 ) {
        return;
      }

      // Check for an intersection
      var intersection = this.getIntersection( incidentRay, this.prisms );
      var L = incidentRay.directionUnitVector;
      var n1 = incidentRay.mediumIndexOfRefraction;
      var wavelengthInN1 = incidentRay.wavelength / n1;
      if ( intersection !== null ) {

        // List the intersection in the model
        if ( showIntersection ) {
          this.intersections.add( intersection );
        }

        var pointOnOtherSide = (incidentRay.directionUnitVector.times( 1E-12 )).add( intersection.point );
        var outputInsidePrism = false;
        var lightRayAfterIntersectionInRay2Form = new Ray2( pointOnOtherSide, incidentRay.directionUnitVector );
        this.prisms.forEach( function( prism ) {
          var intersection = prism.shape.shape.intersection( lightRayAfterIntersectionInRay2Form );
          if ( intersection.length % 2 === 1 ) {
            outputInsidePrism = true;
          }
        } );

        // Index of refraction of the other medium
        var n2 = outputInsidePrism ?
                 this.prismMedium.getIndexOfRefraction( incidentRay.getBaseWavelength() ) :
                 this.environmentMedium.getIndexOfRefraction( incidentRay.getBaseWavelength() );

        // Precompute for readability
        var point = intersection.point;
        var n = intersection.unitNormal;

        // Compute the output rays, see http://en.wikipedia.org/wiki/Snell's_law#Vector_form
        var cosTheta1 = n.dotXY( L.x * -1, L.y * -1 );
        var cosTheta2Radicand = 1 - Math.pow( n1 / n2, 2 ) * (1 - Math.pow( cosTheta1, 2 ));
        var totalInternalReflection = cosTheta2Radicand < 0;
        var cosTheta2 = Math.sqrt( Math.abs( cosTheta2Radicand ) );
        var vReflect = (n.times( 2 * cosTheta1 )).add( L );
        var vRefract = cosTheta1 > 0 ?
                       (L.times( n1 / n2 )).addXY(
                         n.x * ( n1 / n2 * cosTheta1 - cosTheta2 ),
                         n.y * ( n1 / n2 * cosTheta1 - cosTheta2 )
                       ) :
                       (L.times( n1 / n2 )).addXY(
                         n.x * ( n1 / n2 * cosTheta1 + cosTheta2 ),
                         n.y * ( n1 / n2 * cosTheta1 + cosTheta2 )
                       );

        // Normalize the direction vector, see https://github.com/phetsims/bending-light/issues/226
        vRefract = vRefract.normalized();

        var reflectedPower = totalInternalReflection ? 1
          : Util.clamp( BendingLightModel.getReflectedPower( n1, n2, cosTheta1, cosTheta2 ), 0, 1 );
        var transmittedPower = totalInternalReflection ? 0
          : Util.clamp( BendingLightModel.getTransmittedPower( n1, n2, cosTheta1, cosTheta2 ), 0, 1 );

        // Create the new rays and propagate them recursively
        var reflectedRay = new Ray2( incidentRay.directionUnitVector.times( -1E-12 ).add( point ), vReflect );
        var reflected = new ColoredRay(
          reflectedRay,
          incidentRay.power * reflectedPower,
          incidentRay.wavelength,
          incidentRay.mediumIndexOfRefraction,
          incidentRay.frequency
        );
        var refractedRay = new Ray2( incidentRay.directionUnitVector.times( +1E-12 ).add( point ), vRefract );
        var refracted = new ColoredRay(
          refractedRay,
          incidentRay.power * transmittedPower,
          incidentRay.wavelength,
          n2,
          incidentRay.frequency
        );
        if ( this.showReflections || totalInternalReflection ) {
          this.propagateTheRay( reflected, count + 1, showIntersection );
        }
        this.propagateTheRay( refracted, count + 1, showIntersection );
        rayColor = new Color( 0, 0, 0, 0 );
        rayVisibleColor = VisibleColor.wavelengthToColor( incidentRay.wavelength * 1E9 );
        rayColor.set( rayVisibleColor.getRed(), rayVisibleColor.getGreen(), rayVisibleColor.getBlue(),
          rayVisibleColor.getAlpha() );

        // Add the incident ray itself
        this.addRay( new LightRay( CHARACTERISTIC_LENGTH / 2,
          incidentRay.tail,
          intersection.point,
          n1,
          wavelengthInN1,
          incidentRay.wavelength * 1E9,
          incidentRay.power,
          rayColor,
          waveWidth,
          0,
          true,
          false,
          this.laserView,
          'prism'
        ) );
      }
      else {
        rayColor = new Color( 0, 0, 0, 0 );
        rayVisibleColor = VisibleColor.wavelengthToColor( incidentRay.wavelength * 1E9 );
        rayColor.set( rayVisibleColor.getRed(), rayVisibleColor.getGreen(), rayVisibleColor.getBlue(),
          rayVisibleColor.getAlpha() );

        // No intersection, so the light ray should just keep going
        this.addRay( new LightRay(
          CHARACTERISTIC_LENGTH / 2,
          incidentRay.tail,

          // If the light ray gets too long, it will cause rendering artifacts like #219
          incidentRay.tail.plus( incidentRay.directionUnitVector.times( 2E-4 ) ),
          n1,
          wavelengthInN1,
          incidentRay.wavelength * 1E9,
          incidentRay.power,
          rayColor,
          waveWidth,
          0,
          true,
          false,
          this.laserView,
          'prism'
        ) );
      }
    },

    /**
     * Find the nearest intersection between a light ray and the set of prisms in the play area
     * @private
     * @param {ColoredRay} incidentRay - model of the ray
     * @param {ObservableArray<Prism>} prisms
     * @returns {Intersection|null} - returns the intersection if one was found or null if no intersections
     */
    getIntersection: function( incidentRay, prisms ) {
      var allIntersections = [];
      prisms.forEach( function( prism ) {
        prism.getIntersections( incidentRay ).forEach( function( intersection ) {
          allIntersections.push( intersection );
        } );
      } );

      // Get the closest one (which would be hit first)
      allIntersections = _.sortBy( allIntersections, function( allIntersection ) {
        return allIntersection.point.distance( incidentRay.tail );
      } );
      return allIntersections.length === 0 ? null : allIntersections[ 0 ];
    },

    /**
     * @public
     */
    clear: function() {
      this.intersections.clear();
    }
  } );
} );