// Copyright 2002-2015, University of Colorado Boulder

/**
 * Model for the protractor angle and position
 *
 * @author Chandrashekar Bemagoni(Actual Concepts)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Vector2 = require( 'DOT/Vector2' );
  var PropertySet = require( 'AXON/PropertySet' );

  /**
   *
   * @param {number } x - protractor x position in model co-ordinates
   * @param {number} y - protractor y position in model co-ordinates
   * @constructor
   */
  function ProtractorModel( x, y ) {

    PropertySet.call( this, {
        angle: 0.0,
        position: new Vector2( x, y ) // position of the center
      }
    );

    // reusable vectors to avoid to many vector allocations
    // vector to store new Protractor position
    this.newPosition = new Vector2( 0, 0 );
  }

  return inherit( PropertySet, ProtractorModel, {

    /**
     * @public
     * @param {Vector2} delta
     */
    translate: function( delta ) {
      this.newPosition.x = this.positionProperty.get().x + delta.x;
      this.newPosition.y = this.positionProperty.get().y + delta.y;
      this.positionProperty.set( this.newPosition );
      this.positionProperty._notifyObservers();
    }
  } );
} );