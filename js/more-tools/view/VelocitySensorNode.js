// Copyright 2002-2015, University of Colorado Boulder

/**
 * View for the Velocity Sensor tool. Measures the velocity at the sensor's tip and shows it in the display box. Also
 * points a blue arrow along the direction of the velocity and the arrow length is proportional to the velocity.
 *
 * @author Siddhartha Chinthapally (Actual Concepts)
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Text = require( 'SCENERY/nodes/Text' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var Property = require( 'AXON/Property' );
  var Shape = require( 'KITE/Shape' );
  var Path = require( 'SCENERY/nodes/Path' );
  var LinearGradient = require( 'SCENERY/util/LinearGradient' );
  var ArrowShape = require( 'SCENERY_PHET/ArrowShape' );
  var ShadedRectangle = require( 'SCENERY_PHET/ShadedRectangle' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Vector2 = require( 'DOT/Vector2' );
  var MovableDragHandler = require( 'SCENERY_PHET/input/MovableDragHandler' );
  var BendingLightConstants = require( 'BENDING_LIGHT/common/BendingLightConstants' );
  var Util = require( 'DOT/Util' );
  var StringUtils = require( 'PHETCOMMON/util/StringUtils' );
  var TweenUtil = require( 'BENDING_LIGHT/common/view/TweenUtil' );

  // strings
  var speedString = require( 'string!BENDING_LIGHT/speed' );
  var c_units = require( 'string!BENDING_LIGHT/c_units' );
  var velocityPattern = require( 'string!BENDING_LIGHT/velocityPattern' );

  // constants
  var VELOCITY_SENSOR_SCALE_INSIDE_TOOLBOX = 0.7;
  var VELOCITY_SENSOR_SCALE_OUTSIDE_TOOLBOX = 1;

  /**
   * @param {Node} beforeLightLayer2 - layer in which VelocitySensorNode is present when in toolbox
   * @param {Node} afterLightLayer2 - layer in which VelocitySensorNode is present when in play area
   * @param {ModelViewTransform2} modelViewTransform - Transform between model and view coordinate frames
   * @param {VelocitySensor} velocitySensor - model for the velocity sensor
   * @param {number} arrowScale - scale to be applied for the velocity value to display as arrow
   * @param {Rectangle} container - toolbox node bounds
   * @param {Bounds2} dragBounds - bounds that define where the velocity sensor may be dragged
   * @constructor
   */
  function VelocitySensorNode( beforeLightLayer2, afterLightLayer2, modelViewTransform, velocitySensor, arrowScale,
                               container, dragBounds ) {

    var velocitySensorNode = this;
    Node.call( this, { cursor: 'pointer', pickable: true } );

    this.modelViewTransform = modelViewTransform; // @public
    this.velocitySensor = velocitySensor; // @private
    this.beforeLightLayer2 = beforeLightLayer2; // @private
    this.afterLightLayer2 = afterLightLayer2; // @private

    var rectangleWidth = 100;
    var rectangleHeight = 70;
    this.bodyNode = new Node(); // @private

    // Adding outer rectangle
    var outerRectangle = new Rectangle( 0, 0, rectangleWidth, rectangleHeight, 15, 15, {
      stroke: '#844702',
      fill: new LinearGradient( 0, 0, 0, rectangleHeight )
        .addColorStop( 0, '#F3D092' )
        .addColorStop( 0.2, '#DE9103' )
        .addColorStop( 0.6, '#CF8702' )
        .addColorStop( 0.8, '#DE9103' )
        .addColorStop( 1, '#B07200' ),
      lineWidth: 1
    } );
    this.bodyNode.addChild( outerRectangle );

    // Second rectangle
    var innerRectangle = new Rectangle( 0, 0, rectangleWidth - 8, rectangleHeight - 10, 10, 10, {
      fill: '#C98303',
      centerX: outerRectangle.centerX,
      centerY: outerRectangle.centerY
    } );
    this.bodyNode.addChild( innerRectangle );

    // Adding velocity meter title text
    var titleText = new Text( speedString, {
      fill: 'black',
      font: new PhetFont( 18 )
    } );
    if ( titleText.width > rectangleWidth - 15 ) {
      titleText.scale( (rectangleWidth - 15) / titleText.width );
    }
    titleText.centerX = innerRectangle.centerX;
    titleText.bottom = innerRectangle.bottom;
    this.bodyNode.addChild( titleText );

    // Adding inner rectangle
    var whiteTextArea = new ShadedRectangle( new Bounds2( 10, 0, rectangleWidth - 10, rectangleHeight - 38 ), {
      baseColor: 'white',
      lightSource: 'rightBottom',
      cornerRadius: 5,
      centerX: innerRectangle.centerX,
      top: innerRectangle.top + 5
    } );
    this.bodyNode.addChild( whiteTextArea );

    // Adding velocity measure label
    var labelText = new Text( '', {
      fill: 'black',
      font: new PhetFont( 12 ),
      center: whiteTextArea.center
    } );
    this.bodyNode.addChild( labelText );

    var triangleHeight = 30;
    var triangleWidth = 16;

    // Adding triangle shape
    var triangleShapeNode = new Path( new Shape().
      moveTo( 0, -triangleHeight / 2 ).
      lineTo( -triangleWidth, 0 ).
      lineTo( 0, triangleHeight / 2 ), {
      fill: '#C88203',
      stroke: '#844702',
      right: outerRectangle.left,
      centerY: outerRectangle.centerY
    } );
    this.bodyNode.addChild( triangleShapeNode );
    this.addChild( this.bodyNode );
    this.bodyWidth = rectangleWidth; // @private
    this.bodyHeight = rectangleHeight + triangleWidth; // @private

    // Arrow shape
    var arrowWidth = 6;
    this.arrowShape = new Path( new ArrowShape( 0, 0, modelViewTransform.modelToViewDeltaX( velocitySensor.value.x ),
      modelViewTransform.modelToViewDeltaY( velocitySensor.value.y ) ), { fill: 'blue' } );
    this.bodyNode.addChild( this.arrowShape );

    velocitySensor.valueProperty.link( function( velocity ) {

      var positionX = modelViewTransform.modelToViewDeltaX( velocitySensor.value.x ) * arrowScale;
      var positionY = modelViewTransform.modelToViewDeltaY( velocitySensor.value.y ) * arrowScale;

      this.arrowShape.setShape( new ArrowShape( 0, 0, positionX, positionY, {
        tailWidth: arrowWidth,
        headWidth: 2 * arrowWidth,
        headHeight: 2 * arrowWidth
      } ) );

      // Set the arrowShape path position so that the center of the tail coincides with the tip of the sensor
      if ( this.arrowShape.bounds.isFinite() ) {

        // If the velocity y component is positive then the arrow will face up, so set the bottom of the arrow to the
        // tip of the sensor
        if ( velocity.y >= 0 ) {
          this.arrowShape.bottom = triangleShapeNode.bottom + arrowWidth / 2 * Math.cos( Math.abs( velocity.angle() ) );
        }
        else {

          // if the velocity y component is negative then the arrow will face down, so set the top of the arrow to the
          // tip of the sensor
          this.arrowShape.top = triangleShapeNode.bottom - arrowWidth / 2 * Math.cos( Math.abs( velocity.angle() ) );
        }

        // if the velocity x component is positive then the arrow will direct towards right, so set the left of the
        // arrow to the tip of the sensor
        if ( velocity.x > 0 ) {
          this.arrowShape.left = outerRectangle.centerX - arrowWidth / 2 * Math.sin( Math.abs( velocity.angle() ) );
        }
        else if ( velocity.x === 0 ) {
          this.arrowShape.left = outerRectangle.centerX - arrowWidth;
        }
        else {
          this.arrowShape.right = outerRectangle.centerX + arrowWidth / 2 * Math.sin( Math.abs( velocity.angle() ) );
        }
      }
    }.bind( velocitySensorNode ) );

    velocitySensor.isArrowVisibleProperty.linkAttribute( this.arrowShape, 'visible' );
    var velocityNodeDragBounds = dragBounds.shiftedY( (rectangleHeight + triangleWidth) / 2 );

    // Drag handler
    this.addInputListener( new MovableDragHandler( velocitySensor.positionProperty, {
      dragBounds: modelViewTransform.viewToModelBounds( velocityNodeDragBounds ),
      modelViewTransform: modelViewTransform,
      endDrag: function() {
        if ( container.bounds.containsCoordinates(
            velocitySensorNode.bodyNode.getCenterX(), velocitySensorNode.bodyNode.getCenterY() ) ) {
          velocitySensorNode.setScaleAnimation( velocitySensor.positionProperty.initialValue,
            VELOCITY_SENSOR_SCALE_INSIDE_TOOLBOX );
          velocitySensor.reset();
          velocitySensorNode.addToSensorPanel();
          velocitySensor.enabledProperty.set( false );
        }
      }
    } ) );
    this.shape = new Path( Shape.rectangle( 20, 265, 85, 69 ), {
      pickable: true,
      cursor: 'pointer'
    } );
    this.addChild( this.shape );
    this.shape.addInputListener( new MovableDragHandler( velocitySensor.positionProperty, {
      dragBounds: modelViewTransform.viewToModelBounds( velocityNodeDragBounds ),
      modelViewTransform: modelViewTransform,
      startDrag: function() {
        if ( container.bounds.containsCoordinates(
            velocitySensorNode.bodyNode.getCenterX(), velocitySensorNode.bodyNode.getCenterY() ) ) {
          velocitySensorNode.setScaleAnimation( velocitySensor.position, VELOCITY_SENSOR_SCALE_OUTSIDE_TOOLBOX );
          velocitySensorNode.addToMoreToolsView();
          velocitySensor.enabledProperty.set( true );
        }
      },
      endDrag: function() {
        if ( container.bounds.containsCoordinates(
            velocitySensorNode.bodyNode.getCenterX(), velocitySensorNode.bodyNode.getCenterY() ) ) {
          velocitySensorNode.setScaleAnimation( velocitySensor.positionProperty.initialValue,
            VELOCITY_SENSOR_SCALE_INSIDE_TOOLBOX );
          velocitySensor.reset();
          velocitySensorNode.addToSensorPanel();
          velocitySensor.enabledProperty.set( false );
        }
      }
    } ) );
    velocitySensor.enabledProperty.link( function( enable ) {
      velocitySensorNode.shape.setVisible( !enable );
    } );

    velocitySensor.positionProperty.link( function( position ) {

      var velocitySensorNodeScaleVector = velocitySensorNode.bodyNode.getScaleVector();
      var velocitySensorXPosition = modelViewTransform.modelToViewX( position.x );
      var velocitySensorYPosition = modelViewTransform.modelToViewY( position.y );

      velocitySensorNode.bodyNode.setTranslation(
        velocitySensorXPosition,
        velocitySensorYPosition - velocitySensorNode.bodyHeight / 2 * velocitySensorNodeScaleVector.y );
    } );

    // Update the text when the value or units changes.
    Property.multilink( [ velocitySensor.valueProperty, velocitySensor.positionProperty ],
      function( velocity ) {
        if ( velocity.magnitude() === 0 ) {
          labelText.text = '?';
        }
        else {
          var text = StringUtils.format( velocityPattern, Util.toFixed( velocity.magnitude() / BendingLightConstants.SPEED_OF_LIGHT, 2 ), c_units );
          labelText.setText( text );
        }
        labelText.center = whiteTextArea.center;
      } );
    this.setVelocitySensorScale( VELOCITY_SENSOR_SCALE_INSIDE_TOOLBOX );
  }

  return inherit( Node, VelocitySensorNode, {

    /**
     * Resize the VelocitySensorNode
     * @public
     * @param {number} scale - scale to be applied to velocity node
     */
    setVelocitySensorScale: function( scale ) {
      this.bodyNode.setScaleMagnitude( scale );
      var velocitySensorNodeScaleVector = this.bodyNode.getScaleVector();
      var velocitySensorXPosition = this.modelViewTransform.modelToViewX( this.velocitySensor.position.x );
      var velocitySensorYPosition = this.modelViewTransform.modelToViewY( this.velocitySensor.position.y );
      this.bodyNode.setTranslation(
        velocitySensorXPosition - this.bodyWidth / 2 * velocitySensorNodeScaleVector.x,
        velocitySensorYPosition - this.bodyHeight * velocitySensorNodeScaleVector.y
      );
    },

    /**
     * Resize the VelocitySensorNode with Animation
     * @public
     * @param {Vector2} endPoint - position at final state of animation
     * @param {number} scale - scale at final state of animation
     */
    setScaleAnimation: function( endPoint, scale ) {
      var startPosition = {
        x: this.velocitySensor.position.x,
        y: this.velocitySensor.position.y,
        scale: this.bodyNode.getScaleVector().x
      };
      var finalPosition = { x: endPoint.x, y: endPoint.y, scale: scale };
      var bodyNode = this.bodyNode;
      var VelocitySensorNode = this;
      TweenUtil.startTween( this, startPosition, finalPosition, function() {
        bodyNode.setScaleMagnitude( startPosition.scale );
        VelocitySensorNode.velocitySensor.positionProperty.set( new Vector2( startPosition.x, startPosition.y ) );
      } );
    },

    /**
     * Adds VelocitySensorNode to play area and removes from tool box
     * @public
     */
    addToMoreToolsView: function() {

      if ( this.beforeLightLayer2.isChild( this ) ) {
        this.beforeLightLayer2.removeChild( this );
      }
      if ( !this.afterLightLayer2.isChild( this ) ) {
        this.afterLightLayer2.addChild( this );
      }
      this.touchArea = this.bodyNode.bounds;
    },

    /**
     * Adds VelocitySensorNode to tool box and removes from play area if present
     * @public
     */
    addToSensorPanel: function() {

      if ( this.afterLightLayer2.isChild( this ) ) {
        this.afterLightLayer2.removeChild( this );
      }
      if ( !this.beforeLightLayer2.isChild( this ) ) {
        this.beforeLightLayer2.addChild( this );
      }
      this.touchArea = this.shape.bounds;
    },

    /**
     * @public
     */
    reset: function() {
      this.setVelocitySensorScale( VELOCITY_SENSOR_SCALE_INSIDE_TOOLBOX );
      if ( this.afterLightLayer2.isChild( this ) ) {
        this.addToSensorPanel();
      }
      this.velocitySensor.reset();
    }
  } );
} );