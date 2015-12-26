// Copyright 2015, University of Colorado Boulder

/**
 * Control that shows a spectrum and lets the user choose the color for monochromatic light.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var BendingLightConstants = require( 'BENDING_LIGHT/common/BendingLightConstants' );
  var WavelengthSlider = require( 'SCENERY_PHET/WavelengthSlider' );
  var Text = require( 'SCENERY/nodes/Text' );
  var ArrowButton = require( 'SCENERY_PHET/buttons/ArrowButton' );
  var Property = require( 'AXON/Property' );
  var StringUtils = require( 'PHETCOMMON/util/StringUtils' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var VisibleColor = require( 'SCENERY_PHET/VisibleColor' );
  var Util = require( 'DOT/Util' );

  // strings
  var unitsNmString = require( 'string!BENDING_LIGHT/units_nm' );
  var wavelengthPatternString = require( 'string!BENDING_LIGHT/wavelengthPattern' );

  // constants
  var PLUS_MINUS_SPACING = 4;

  /**
   *
   * @constructor
   */
  function WavelengthControl( wavelengthProperty, enabledProperty, trackWidth ) {
    var wavelengthPropertyNM = new Property( wavelengthProperty.value * 1E9 );

    wavelengthProperty.link( function( wavelength ) {
      wavelengthPropertyNM.value = wavelength * 1E9;
    } );
    // Add WavelengthSlider node
    var wavelengthSlider = new WavelengthSlider( wavelengthPropertyNM, {
      cursorStroke: 'white',
      maxWavelength: BendingLightConstants.LASER_MAX_WAVELENGTH,
      thumbWidth: 20,
      thumbHeight: 20,
      trackWidth: trackWidth,
      trackHeight: 20,
      tweakersVisible: false,
      valueVisible: false,
      thumbTouchAreaExpandY: 4,
      pointerAreasOverTrack: true
    } );

    var formattedString = StringUtils.format( wavelengthPatternString, Util.roundSymmetric( wavelengthPropertyNM.value ) );

    // Prevent the i18n strings from making the wavelength slider too wide, see #311
    var maxWidth = 80;
    var wavelengthValueText = new Text( formattedString, { maxWidth: maxWidth } );
    var wavelengthBoxShape = new Rectangle( 0, 0, new Text( unitsNmString, { maxWidth: maxWidth } ).width + 36, 18, 2, 2, {
      fill: 'white',
      stroke: 'black'
    } );

    // add plus button
    var plusButton = new ArrowButton( 'right', function propertyPlus() {
      wavelengthPropertyNM.set(
        Math.min( wavelengthPropertyNM.value + 1, BendingLightConstants.LASER_MAX_WAVELENGTH ) );
    }, {
      scale: 0.6
    } );

    // touch area
    plusButton.touchArea = new Bounds2( plusButton.localBounds.minX - 20, plusButton.localBounds.minY - 5,
      plusButton.localBounds.maxX + 20, plusButton.localBounds.maxY + 8 );

    // add minus button
    var minusButton = new ArrowButton( 'left', function propertyMinus() {
      wavelengthPropertyNM.set(
        Math.max( wavelengthPropertyNM.value - 1, VisibleColor.MIN_WAVELENGTH ) );
    }, {
      scale: 0.6
    } );

    // disable the minus button at minimum wavelength and plus button at max wavelength
    wavelengthPropertyNM.link( function( wavelength ) {
      plusButton.enabled = ( wavelength < BendingLightConstants.LASER_MAX_WAVELENGTH);
      minusButton.enabled = ( wavelength > VisibleColor.MIN_WAVELENGTH );
    } );

    // touch area
    minusButton.touchArea = new Bounds2( minusButton.localBounds.minX - 20, minusButton.localBounds.minY - 5,
      minusButton.localBounds.maxX + 20, minusButton.localBounds.maxY + 8 );

    // set the position of the wavelength text box
    wavelengthBoxShape.centerX = wavelengthSlider.centerX;
    wavelengthBoxShape.bottom = wavelengthSlider.top - 5;

    // set the position of the wavelength value in the center of text box
    wavelengthValueText.centerX = wavelengthBoxShape.centerX;
    wavelengthValueText.centerY = wavelengthBoxShape.centerY;

    // Plus button to the right of the value
    plusButton.left = wavelengthBoxShape.right + PLUS_MINUS_SPACING;
    plusButton.centerY = wavelengthBoxShape.centerY;

    // Minus button to the left of the value
    minusButton.right = wavelengthBoxShape.left - PLUS_MINUS_SPACING;
    minusButton.centerY = wavelengthBoxShape.centerY;

    var wavelengthControl = this;
    Node.call( this, {
      children: [
        minusButton,
        wavelengthBoxShape,
        wavelengthValueText,
        plusButton,
        wavelengthSlider
      ]
    } );
    enabledProperty.link( function( enabled ) {

      // set the opacity when not selected
      wavelengthControl.setPickable( enabled );
      wavelengthControl.opacity = enabled ? 1 : 0.4;
    } );

    wavelengthPropertyNM.link( function( wavelength ) {

      // set the laser wavelength according to the slider wavelength
      wavelengthProperty.set( wavelength / 1E9 );

      // set the value in the slider text box
      wavelengthValueText.setText( StringUtils.format( wavelengthPatternString, Util.roundSymmetric( wavelength ), unitsNmString ) );
    } );
  }

  return inherit( Node, WavelengthControl );
} );