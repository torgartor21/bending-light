// Copyright 2002-2015, University of Colorado Boulder

/**
 * Model for the intensity meter, including the position of the sensor, body, the reading values, etc.
 * When multiple rays hit the sensor, they are summed up.
 *
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var PropertySet = require( 'AXON/PropertySet' );
  var Vector2 = require( 'DOT/Vector2' );
  var Shape = require( 'KITE/Shape' );
  var Reading = require( 'BENDING_LIGHT/common/model/Reading' );

  /**
   *
   * @param {number} sensorX - sensor x position in model values
   * @param {number} sensorY - sensor  y position in model values
   * @param {number} bodyX - body x position in model values
   * @param {number} bodyY - body y position in model values
   * @constructor
   */
  function IntensityMeter( sensorX, sensorY, bodyX, bodyY ) {

    PropertySet.call( this, {
        reading: Reading.MISS,  // value to show on the body
        sensorPosition: new Vector2( sensorX, sensorY ),
        bodyPosition: new Vector2( bodyX, bodyY )
      }
    );

    //
    this.newSensorPosition = new Vector2();

    //
    this.newBodyPosition = new Vector2();

    // accumulation of readings
    this.rayReadings = [];
  }

  return inherit( PropertySet, IntensityMeter, {

      /**
       * @public
       * @param {number} deltaX - amount space in x the sensor translated.
       * @param {number} deltaY - amount space in y the sensor translated.
       */
      translateSensorXY: function( deltaX, deltaY ) {
        this.newSensorPosition.x = this.sensorPosition.x + deltaX;
        this.newSensorPosition.y = this.sensorPosition.y + deltaY;
        this.sensorPositionProperty.set( this.newSensorPosition );
        this.sensorPositionProperty._notifyObservers();
      },

      /**
       * @public
       * @param {number} deltaX - amount space in x the body translated.
       * @param {number} deltaY - amount space in y the body translated.
       */
      translateBodyXY: function( deltaX, deltaY ) {
        this.newBodyPosition.x = this.bodyPosition.x + deltaX;
        this.newBodyPosition.y = this.bodyPosition.y + deltaY;
        this.bodyPositionProperty.set( this.newBodyPosition );
        this.bodyPositionProperty._notifyObservers();
      },

      /**
       * @public
       * @returns {Shape}
       */
      getSensorShape: function() {
        // fine tuned to match the given image
        var radius = 1.215E-6;
        return new Shape().arcPoint( this.sensorPosition, radius, 0, Math.PI * 2, false );
      },

      /**
       * Should be called before a model update so that values from last computation
       * don't leak over into the next summation
       * @public
       */
      clearRayReadings: function() {
        this.rayReadings = [];
        this.readingProperty.set( Reading.MISS );
      },

      /**
       * Add a new reading to the accumulator and update the readout
       * @public
       * @param {Reading/ MISS} r
       */
      addRayReading: function( r ) {
        this.rayReadings.push( r );
        this.updateReading();
      },

      /**
       * Update the body text based on the accumulated Reading values
       * @private
       */
      updateReading: function() {

        // enumerate the hits
        var hits = [];
        this.rayReadings.forEach( function( rayReading ) {
          if ( rayReading.isHit() ) {
            hits.push( rayReading );
          }
        } );

        // if not hits, say "MISS"
        if ( hits.length === 0 ) {
          this.readingProperty.set( Reading.MISS );
        }
        else // otherwise, sum the intensities
        {
          var total = 0.0;
          hits.forEach( function( hit ) {
            total += hit.getValue();
          } );
          this.readingProperty.set( new Reading( total ) );
        }
      },

      /**
       * @public
       * @param {number} deltaX
       * @param {number} deltaY
       */
      translateAllXY: function( deltaX, deltaY ) {
        this.translateBodyXY( deltaX, deltaY );
        this.translateSensorXY( deltaX, deltaY );
      }
    },
    {
      Reading: Reading
    } );
} );
