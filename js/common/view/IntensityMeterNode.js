// Copyright 2002-2015, University of Colorado Boulder

/**
 * View for the intensity meter, including its movable sensor and readout region (called the body).
 *
 * @author Sam Reid
 * @author Chandrashekar Bemagoni(Actual Concepts)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Text = require( 'SCENERY/nodes/Text' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var SimpleDragHandler = require( 'SCENERY/input/SimpleDragHandler' );
  var WireNode = require( 'BENDING_LIGHT/common/view/WireNode' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var LinearGradient = require( 'SCENERY/util/LinearGradient' );
  var ShadedRectangle = require( 'SCENERY_PHET/ShadedRectangle' );
  var Shape = require( 'KITE/Shape' );
  var Path = require( 'SCENERY/nodes/Path' );
  var RadialGradient = require( 'SCENERY/util/RadialGradient' );
  var Vector2 = require( 'DOT/Vector2' );

  // strings
  var intensityString = require( 'string!BENDING_LIGHT/intensity' );

  //  constants
  var INTENSITY_METER_SCALE_INSIDE_TOOLBOX = 0.25;
  var INTENSITY_METER_SCALE_OUTSIDE_TOOLBOX = 0.85;

  /**
   *
   * @param {BendingLightView} bendingLightView
   * @param {ModelViewTransform2} modelViewTransform - Transform between model and view coordinate frames
   * @param {IntensityMeter} intensityMeter - model for the intensity meter
   * @param {Bounds2} containerBounds - bounds of container for  intensity meter
   * @param {Bounds2} dragBounds - bounds that define where the intensity meter may be dragged
   * @constructor
   */
  function IntensityMeterNode( bendingLightView, modelViewTransform, intensityMeter, containerBounds, dragBounds ) {

    var intensityMeterNode = this;
    Node.call( intensityMeterNode );
    this.bendingLightView = bendingLightView;
    this.modelViewTransform = modelViewTransform;
    this.intensityMeter = intensityMeter;
    var intensityMeterDragBounds = modelViewTransform.viewToModelBounds( dragBounds ); //  in model co- ordinates

    // add sensor node
    var sensorShape = new Shape()
      .ellipticalArc( 50, 50, 50, 50, 0, Math.PI * 0.8, Math.PI * 0.2, false )
      .quadraticCurveTo( 84, 87, 82, 100 )
      .quadraticCurveTo( 81, 115, 80, 130 )
      .quadraticCurveTo( 80, 151, 65, 151 )
      .quadraticCurveTo( 50, 151, 35, 151 )
      .quadraticCurveTo( 20, 151, 20, 130 )
      .quadraticCurveTo( 19, 115, 18, 100 )
      .quadraticCurveTo( 16, 87, 11, 82 )
      .close();
    var sensorOuterShape = new Path( sensorShape, {
      stroke: new LinearGradient( 0, 0, 0, 151 )
        .addColorStop( 0, '#408260' )
        .addColorStop( 1, '#005D2D' ),
      fill: new LinearGradient( 0, 0, 0, 151 )
        .addColorStop( 0, '#7CCAA2' )
        .addColorStop( 0.3, '#009348' )
        .addColorStop( 1, '#008B44' ),
      lineWidth: 2
    } );

    var sensorInnerShape = new Path( sensorShape, {
      fill: '#008541',
      lineWidth: 2,
      scale: new Vector2( 0.9, 0.93 ),
      centerX: sensorOuterShape.centerX,
      y: 5
    } );
    var sensorInnerCircle = new Path( new Shape().circle( 50, 50, 35 ), {
      fill: new RadialGradient( 35, 17.5, 0, 35, 70, 60 )
        .addColorStop( 0, 'white' )
        .addColorStop( 0.4, '#E6F5FF' )
        .addColorStop( 1, '#C2E7FF' ),
      centerX: sensorInnerShape.centerX,
      centerY: 50
    } );

    this.sensorNode = new Node( {
      children: [ sensorOuterShape, sensorInnerShape, sensorInnerCircle ],
      cursor: 'pointer'
    } );

    // sensor location
    intensityMeter.sensorPositionProperty.link( function( location ) {
      var sensorPositionX = modelViewTransform.modelToViewX( location.x );
      var sensorPositionY = modelViewTransform.modelToViewY( location.y );
      intensityMeterNode.sensorNode.setTranslation(
        sensorPositionX - (intensityMeterNode.sensorNode.getWidth() / 2),
        sensorPositionY - intensityMeterNode.sensorNode.getHeight() * 0.32 );
    } );

    // sensor node drag handler
    var start;
    var position;
    this.sensorNode.addInputListener( new SimpleDragHandler( {
      start: function( event ) {
        start = intensityMeterNode.globalToParentPoint( event.pointer.point );
      },
      drag: function( event ) {
        var end = intensityMeterNode.globalToParentPoint( event.pointer.point );
        intensityMeterNode.dragSensorXY( end.x - start.x, end.y - start.y );
        position = intensityMeterDragBounds.closestPointTo( intensityMeter.sensorPosition );
        intensityMeter.sensorPositionProperty.set( position );
        start = end;
      },
      end: function() {
        // check intersection only with the outer rectangle.
        if ( containerBounds.containsCoordinates(
            intensityMeterNode.sensorNode.getCenterX(), intensityMeterNode.sensorNode.getCenterY() ) ) {
          var sensorNodeInitialPosition = intensityMeter.sensorPositionProperty.initialValue;
          intensityMeterNode.setIntensityMeterScaleAnimation(
            sensorNodeInitialPosition.x, sensorNodeInitialPosition.y, INTENSITY_METER_SCALE_INSIDE_TOOLBOX );
          intensityMeterNode.setIntensityMeterScale(
            sensorNodeInitialPosition.x, sensorNodeInitialPosition.y, INTENSITY_METER_SCALE_INSIDE_TOOLBOX );
          intensityMeter.reset();
          intensityMeterNode.addToSensorPanel();
          intensityMeter.enabledProperty.set( false );
        }
      }
    } ) );

    // add body node
    var rectangleWidth = 150;
    var rectangleHeight = 105;

    // adding outer rectangle
    var outerRectangle = new Rectangle( 0, 0, rectangleWidth, rectangleHeight, 5, 5, {
      stroke: new LinearGradient( 0, 0, 0, rectangleHeight )
        .addColorStop( 0, '#408260' )
        .addColorStop( 1, '#005127' ),
      fill: new LinearGradient( 0, 0, 0, rectangleHeight )
        .addColorStop( 0, '#06974C' )
        .addColorStop( 0.6, '#00773A' ),
      lineWidth: 2
    } );

    //second rectangle
    var innerRectangle = new Rectangle( 2, 2, rectangleWidth - 10, rectangleHeight - 10, 5, 5, {
      fill: '#008541',
      centerX: outerRectangle.centerX,
      centerY: outerRectangle.centerY
    } );

    // adding inner rectangle
    var innerMostRectangle = new ShadedRectangle( new Bounds2( 10, 0, rectangleWidth * 0.8, rectangleHeight * 0.5 ),
      {
        baseColor: 'white',
        lightSource: 'rightBottom',
        centerX: innerRectangle.centerX,
        centerY: rectangleHeight * 0.6
      } );

    //Add a "Intensity" title to the body node
    var titleNode = new Text( intensityString, { font: new PhetFont( 20 ), fill: 'white' } );
    if ( titleNode.width > rectangleWidth - 15 ) {
      titleNode.scale( (rectangleWidth - 15) / titleNode.width );
    }
    //Add the reading to the body node
    var valueNode = new Text( intensityMeter.reading.getString(),
      { font: new PhetFont( 25 ), fill: 'black' } );

    this.bodyNode = new Node( {
      children: [ outerRectangle, innerRectangle, innerMostRectangle, titleNode, valueNode ],
      cursor: 'pointer'
    } );
    titleNode.setTranslation( (this.bodyNode.getWidth() - titleNode.getWidth()) / 2,
      this.bodyNode.getHeight() * 0.23 );
    // displayed value
    intensityMeter.readingProperty.link( function() {
      valueNode.setText( intensityMeter.reading.getString() );
      valueNode.setTranslation( innerMostRectangle.centerX - valueNode.width / 2,
        innerMostRectangle.centerY + valueNode.height / 2 );
    } );

    //body location
    intensityMeter.bodyPositionProperty.link( function( location ) {
      var bodyPositionX = modelViewTransform.modelToViewX( location.x );
      var bodyPositionY = modelViewTransform.modelToViewY( location.y );
      intensityMeterNode.bodyNode.setTranslation( bodyPositionX - intensityMeterNode.bodyNode.getWidth() / 2,
        bodyPositionY - intensityMeterNode.bodyNode.getHeight() / 2 );
    } );

    // body drag handler
    this.bodyNode.addInputListener( new SimpleDragHandler( {
      start: function( event ) {
        intensityMeterNode.moveToFront();
        start = intensityMeterNode.globalToParentPoint( event.pointer.point );
      },
      drag: function( event ) {
        var end = intensityMeterNode.globalToParentPoint( event.pointer.point );
        intensityMeterNode.dragBodyXY( end.x - start.x, end.y - start.y );
        position = intensityMeterDragBounds.closestPointTo( intensityMeter.bodyPosition );
        intensityMeter.bodyPositionProperty.set( position );
        start = end;
      },
      end: function() {
        // check intersection only with the outer rectangle.
        if ( containerBounds.containsCoordinates(
            intensityMeterNode.bodyNode.getCenterX(), intensityMeterNode.bodyNode.getCenterY() ) ) {
          var sensorInitialPosition = intensityMeter.sensorPositionProperty.initialValue;
          intensityMeterNode.setIntensityMeterScaleAnimation(
            sensorInitialPosition.x, sensorInitialPosition.y, INTENSITY_METER_SCALE_INSIDE_TOOLBOX );
          intensityMeterNode.setIntensityMeterScale(
            sensorInitialPosition.x, sensorInitialPosition.y, INTENSITY_METER_SCALE_INSIDE_TOOLBOX );
          intensityMeter.reset();
          intensityMeterNode.addToSensorPanel();
          intensityMeter.enabledProperty.set( false );
        }
      }
    } ) );

    // scale sensorNode and bodyNode and translating
    this.bodyNode.setScaleMagnitude( INTENSITY_METER_SCALE_INSIDE_TOOLBOX );
    this.sensorNode.setScaleMagnitude( INTENSITY_METER_SCALE_INSIDE_TOOLBOX );
    this.sensorNode.setTranslation(
      modelViewTransform.modelToViewX( intensityMeter.sensorPosition.x ) - (this.sensorNode.getWidth() / 2),
      modelViewTransform.modelToViewY( intensityMeter.sensorPosition.y ) - (this.sensorNode.getHeight() * 0.32) );
    this.bodyNode.setTranslation(
      modelViewTransform.modelToViewX( intensityMeter.bodyPosition.x ) - this.bodyNode.getWidth() / 2,
      modelViewTransform.modelToViewY( intensityMeter.bodyPosition.y ) - this.bodyNode.getHeight() / 2 );

    //Connect the sensor to the body with a gray wire
    var wireNode = new WireNode( intensityMeter.sensorPositionProperty, intensityMeter.bodyPositionProperty,
      this.sensorNode, this.bodyNode, 'gray' );

    //add the components
    this.addChild( wireNode );
    this.addChild( this.sensorNode );
    this.addChild( this.bodyNode );

    this.shape = new Path( Shape.rectangle( 20, 380, 85, 45 ), {
      pickable: true,
      cursor: 'pointer'
    } );
    this.addChild( this.shape );

    this.shape.addInputListener( new SimpleDragHandler( {
      start: function( event ) {
        start = intensityMeterNode.globalToParentPoint( event.pointer.point );
        var sensorStartPositionX = modelViewTransform.viewToModelX( start.x );
        var sensorStartPositionY = modelViewTransform.viewToModelY( start.y );
        intensityMeterNode.setIntensityMeterScaleAnimation(
          sensorStartPositionX, sensorStartPositionY, INTENSITY_METER_SCALE_OUTSIDE_TOOLBOX );
        intensityMeterNode.setIntensityMeterScale(
          sensorStartPositionX, sensorStartPositionY, INTENSITY_METER_SCALE_OUTSIDE_TOOLBOX );
        intensityMeterNode.addToBendingLightView();
        intensityMeter.enabledProperty.set( true );
      },
      drag: function( event ) {
        var end = intensityMeterNode.globalToParentPoint( event.pointer.point );
        var sensorPosition = intensityMeter.sensorPosition;
        intensityMeterNode.dragAllXY( end.x - start.x, end.y - start.y );
        position = intensityMeterDragBounds.closestPointTo( sensorPosition );
        intensityMeter.translateAllXY( position.x - sensorPosition.x, position.y - sensorPosition.y );
        position = intensityMeterDragBounds.closestPointTo( intensityMeter.bodyPosition );
        intensityMeter.translateAllXY(
          position.x - intensityMeter.bodyPosition.x, position.y - intensityMeter.bodyPosition.y );
        start = end;
      },
      end: function() {
        // check intersection only with the outer rectangle.
        if ( containerBounds.containsCoordinates(
            intensityMeterNode.sensorNode.getCenterX(), intensityMeterNode.sensorNode.getCenterY() ) ||
             containerBounds.containsCoordinates(
               intensityMeterNode.sensorNode.getCenterX(), intensityMeterNode.sensorNode.getCenterY() ) ) {
          var sensorNodeInitialPosition = intensityMeter.sensorPositionProperty.initialValue;
          intensityMeterNode.setIntensityMeterScaleAnimation(
            sensorNodeInitialPosition.x, sensorNodeInitialPosition.y, INTENSITY_METER_SCALE_INSIDE_TOOLBOX );
          intensityMeterNode.setIntensityMeterScale(
            sensorNodeInitialPosition.x, sensorNodeInitialPosition.y, INTENSITY_METER_SCALE_INSIDE_TOOLBOX );
          intensityMeter.reset();
          intensityMeterNode.addToSensorPanel();
          intensityMeter.enabledProperty.set( false );
        }
      }
    } ) );
    intensityMeter.enabledProperty.link( function( enable ) {
      intensityMeterNode.shape.setVisible( !enable );
    } );
  }

  return inherit( Node, IntensityMeterNode, {

    /**
     * Resize the intensityMeterNode
     * @public
     * @param {number} endPositionX
     * @param {number} endPositionY
     * @param {number} scale
     */
    setIntensityMeterScale: function( endPositionX, endPositionY, scale ) {

      //previous scale for scaling the distance between the sensorNode and bodyNode
      var prevScale = this.sensorNode.getScaleVector().x;
      this.bodyNode.setScaleMagnitude( scale );
      this.sensorNode.setScaleMagnitude( scale );

      var sensorPosition = this.intensityMeter.sensorPosition;
      this.intensityMeter.bodyPositionProperty.set(
        new Vector2( sensorPosition.x + (this.intensityMeter.bodyPosition.x - sensorPosition.x ) * scale / prevScale,
          sensorPosition.y + (this.intensityMeter.bodyPosition.y - sensorPosition.y ) * scale / prevScale ) );
      this.intensityMeter.translateAllXY( endPositionX - sensorPosition.x, endPositionY - sensorPosition.y );
    },

    /**
     * Resize the intensityMeterNode with Animation
     * @private
     * @param {number} endPositionX
     * @param {number} endPositionY
     * @param {number} scale
     */
    setIntensityMeterScaleAnimation: function( endPositionX, endPositionY, scale ) {
      var prevScale = this.sensorNode.getScaleVector().x;
      var startPoint = {
        x: this.intensityMeter.sensorPosition.x,
        y: this.intensityMeter.sensorPosition.y,
        scale: prevScale
      };
      var endPoint = { x: endPositionX, y: endPositionY, scale: scale };
      this.init( startPoint, endPoint );
    },

    /**
     * @private
     * @param {Object} startPoint
     * @param {Object} endPoint
     */
    init: function( startPoint, endPoint ) {
      var target = this;
      new TWEEN.Tween( startPoint )
        .to( endPoint, 100 )
        .easing( TWEEN.Easing.Linear.None )
        .onUpdate( function() {
          target.setIntensityMeterScale( startPoint.x, startPoint.y, startPoint.scale );
        } ).start();
    },

    /**
     * @public
     */
    addToBendingLightView: function() {

      if ( this.bendingLightView.beforeLightLayer2.isChild( this ) ) {
        this.bendingLightView.beforeLightLayer2.removeChild( this );
      }
      if ( !this.bendingLightView.beforeLightLayer.isChild( this ) ) {
        this.bendingLightView.beforeLightLayer.addChild( this );
      }
      this.touchArea = null;
      this.sensorNode.touchArea = this.sensorNode.localBounds;
      this.bodyNode.touchArea = this.bodyNode.localBounds;
    },

    /**
     * @public
     */
    addToSensorPanel: function() {

      if ( this.bendingLightView.beforeLightLayer.isChild( this ) ) {
        this.bendingLightView.beforeLightLayer.removeChild( this );
      }

      if ( !this.bendingLightView.beforeLightLayer2.isChild( this ) ) {
        this.bendingLightView.beforeLightLayer2.addChild( this );
      }
      this.touchArea = this.shape.bounds;
      this.sensorNode.touchArea = null;
      this.bodyNode.touchArea = null;
    },

    /**
     * Drag all components, called when dragging from toolbox
     * @private
     * @param {number} deltaX
     * @param {number} deltaY
     */
    dragAllXY: function( deltaX, deltaY ) {
      this.intensityMeter.translateAllXY(
        this.modelViewTransform.viewToModelDeltaX( deltaX ),
        this.modelViewTransform.viewToModelDeltaY( deltaY ) );
    },

    /**
     * Drag sensorNode
     * @private
     * @param {number} deltaX
     * @param {number} deltaY
     */
    dragSensorXY: function( deltaX, deltaY ) {
      this.intensityMeter.translateSensorXY(
        this.modelViewTransform.viewToModelDeltaX( deltaX ),
        this.modelViewTransform.viewToModelDeltaY( deltaY ) );
    },

    /**
     * Drag bodyNode
     * @private
     * @param {number} deltaX
     * @param {number} deltaY
     */
    dragBodyXY: function( deltaX, deltaY ) {
      this.intensityMeter.translateBodyXY(
        this.modelViewTransform.viewToModelDeltaX( deltaX ),
        this.modelViewTransform.viewToModelDeltaY( deltaY ) );
    },

    /**
     * @public
     */
    reset: function() {
      var sensorInitialPosition = this.intensityMeter.sensorPositionProperty.initialValue;
      this.setIntensityMeterScale(
        sensorInitialPosition.x, sensorInitialPosition.y, INTENSITY_METER_SCALE_INSIDE_TOOLBOX );
      if ( this.bendingLightView.beforeLightLayer.isChild( this ) ) {
        this.addToSensorPanel();
      }
    }
  } );
} );