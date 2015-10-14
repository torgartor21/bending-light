// Copyright 2002-2015, University of Colorado Boulder

/**
 * View for the "Prisms" Screen.
 *
 * @author Chandrashekar Bemagoni (Actual Concepts)
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  var BendingLightView = require( 'BENDING_LIGHT/common/view/BendingLightView' );
  var MediumControlPanel = require( 'BENDING_LIGHT/common/view/MediumControlPanel' );
  var ProtractorNode = require( 'BENDING_LIGHT/common/view/ProtractorNode' );
  var IntersectionNode = require( 'BENDING_LIGHT/prisms/view/IntersectionNode' );
  var Node = require( 'SCENERY/nodes/Node' );
  var PrismToolboxNode = require( 'BENDING_LIGHT/prisms/view/PrismToolboxNode' );
  var FloatingLayout = require( 'BENDING_LIGHT/common/view/FloatingLayout' );
  var WhiteLightCanvasNode = require( 'BENDING_LIGHT/prisms/view/WhiteLightCanvasNode' );
  var TranslationDragHandle = require( 'BENDING_LIGHT/common/view/TranslationDragHandle' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Property = require( 'AXON/Property' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var MediumColorFactory = require( 'BENDING_LIGHT/common/model/MediumColorFactory' );
  var Panel = require( 'SUN/Panel' );
  var Vector2 = require( 'DOT/Vector2' );
  var VBox = require( 'SCENERY/nodes/VBox' );
  var WavelengthControl = require( 'BENDING_LIGHT/common/view/WavelengthControl' );
  var LaserTypeRadioButtonGroup = require( 'BENDING_LIGHT/prisms/view/LaserTypeRadioButtonGroup' );
  var MovableDragHandler = require( 'SCENERY_PHET/input/MovableDragHandler' );

  // constants
  var INSET = 10;

  // string
  var environmentString = require( 'string!BENDING_LIGHT/environment' );

  /**
   * @param {PrismsModel} prismsModel - model of prisms screen
   * @constructor
   */
  function PrismsView( prismsModel ) {

    this.prismLayer = new Node( { layerSplit: true } );
    this.prismsModel = prismsModel;
    var prismsView = this;

    // Specify how the drag angle should be clamped
    function clampDragAngle( angle ) {
      return angle;
    }

    // In prisms tab laser node can rotate 360 degrees.so arrows showing all the times when laser node rotate
    function clockwiseArrowNotAtMax() {
      return true;
    }

    function ccwArrowNotAtMax() {
      return true;
    }

    // Rotation if the user clicks top on the object
    function rotationRegionShape( full, back ) {
      return back;
    }

    function translationRegion( fullShape ) {

      // Empty shape since shouldn't be rotatable in this tab
      return fullShape;
    }

    BendingLightView.call( this,
      prismsModel,
      clampDragAngle,
      clockwiseArrowNotAtMax,
      ccwArrowNotAtMax,
      translationRegion,
      rotationRegionShape,
      'laserKnob',
      90,
      -43,
      // occlusion handler, if the prism is dropped behind a control panel, bump it to the left.
      function( node ) {

        var controlPanels = [ laserControlPanel, environmentMediumControlPanel ];
        controlPanels.forEach( function( controlPanel ) {
          if ( controlPanel.globalBounds.containsPoint( node.globalBounds.center ) ) {
            node.translateViewXY( node.globalToParentBounds( controlPanel.globalBounds ).minX - node.centerX, 0 );
          }
        } );
      }
    );

    // Node for the environment that spans the screen (only for monochromatic light, the white light background
    // is rendered as opaque in the white light node for blending purposes)
    var environmentMediumNode = new Rectangle( 0, 0, 0, 0 );
    prismsModel.environmentMediumProperty.link( function( environmentMedium ) {
      environmentMediumNode.fill = environmentMedium.color;
    } );

    // Put it behind everything else
    this.insertChild( 0, environmentMediumNode );

    var IndexOfRefractionDecimals = 2;

    // Add control panels for setting the index of refraction for each medium
    var environmentMediumControlPanel = new MediumControlPanel( this, prismsModel.environmentMediumProperty,
      environmentString, false, prismsModel.wavelengthProperty, IndexOfRefractionDecimals, {
        xMargin: 7,
        yMargin: 6,
        comboBoxListPosition: 'below'
      } );
    environmentMediumControlPanel.setTranslation(
      this.layoutBounds.right - 2 * INSET - environmentMediumControlPanel.width, this.layoutBounds.top + 15 );
    this.afterLightLayer2.addChild( environmentMediumControlPanel );

    var sliderEnabledProperty = new Property();

    var radioButtonAdapterProperty = new Property( 'singleColor' );
    radioButtonAdapterProperty.link( function( radioButtonAdapterValue ) {
      prismsModel.laser.colorModeProperty.value = radioButtonAdapterValue === 'white' ? 'white' :
                                                  'singleColor';
      prismsModel.manyRays = radioButtonAdapterValue === 'singleColor5x' ? 5 : 1;
      sliderEnabledProperty.value = radioButtonAdapterValue !== 'white';
    } );

    var laserTypeRadioButtonGroup = new LaserTypeRadioButtonGroup( radioButtonAdapterProperty );
    this.afterLightLayer2.addChild( laserTypeRadioButtonGroup );

    var laserControlPanel = new Panel( new VBox( {
      spacing: 10,
      children: [
        new WavelengthControl( prismsModel.wavelengthProperty, sliderEnabledProperty, 146 ) ]
    } ), {
      cornerRadius: 5,
      xMargin: 9,
      yMargin: 6,
      fill: '#EEEEEE',
      stroke: '#696969',
      lineWidth: 1.5
    } );

    this.afterLightLayer2.addChild( laserControlPanel );
    this.incidentWaveLayer.setVisible( false );

    // Optionally show the normal lines at each intersection
    prismsModel.intersections.addItemAddedListener( function( addedIntersection ) {
      if ( prismsModel.showNormals ) {
        var node = new IntersectionNode( prismsView.modelViewTransform, addedIntersection, prismsModel.intersectionStrokeProperty );
        prismsView.addChild( node );

        prismsModel.intersections.addItemRemovedListener( function( removedIntersection ) {
          if ( removedIntersection === addedIntersection ) {
            node.dispose();
            prismsView.removeChild( node );
          }
        } );
      }
    } );

    // Add the reset all button
    var resetAllButton = new ResetAllButton( {
      listener: function() {
        prismsModel.reset();
        prismsView.reset();
        environmentMediumControlPanel.reset();
        prismToolboxNode.objectMediumControlPanel.reset();
        radioButtonAdapterProperty.reset();
      },
      radius: 19
    } );

    this.afterLightLayer2.addChild( resetAllButton );

    // Add prisms tool box Node
    var prismToolboxNode = new PrismToolboxNode(
      this.modelViewTransform,
      prismsModel,
      this.prismLayer,
      this.visibleBoundsProperty,
      this.occlusionHandler, {
        left: this.layoutBounds.minX + 12
      }
    );
    this.afterLightLayer.addChild( prismToolboxNode );

    // Add the protractor node
    var protractorNode = new ProtractorNode( prismsModel.showProtractorProperty, true, {
      scale: 0.23
    } );
    protractorNode.center = this.modelViewTransform.modelToViewXY( 0, 0 );
    var protractorLocation = new Vector2( protractorNode.centerX, protractorNode.centerY );
    var protractorLocationProperty = new Property( protractorLocation );

    var protractorNodeListener = new MovableDragHandler( protractorLocationProperty );
    protractorNode.addInputListener( protractorNodeListener );

    protractorLocationProperty.link( function( protractorLocation ) {
      protractorNode.center = protractorLocation;
    } );

    this.afterLightLayer.addChild( protractorNode );

    this.afterLightLayer.addChild( this.prismLayer );

    FloatingLayout.floatRight( this, [ environmentMediumControlPanel, laserControlPanel, resetAllButton, laserTypeRadioButtonGroup ] );
    FloatingLayout.floatBottom( this, [ prismToolboxNode, resetAllButton ] );
    FloatingLayout.floatTop( this, [ environmentMediumControlPanel ] );

    this.events.on( 'layoutFinished', function() {
      laserTypeRadioButtonGroup.top = environmentMediumControlPanel.bottom + 15;
      laserControlPanel.top = laserTypeRadioButtonGroup.bottom + 15;
    } );

    this.events.on( 'layoutFinished', function( dx, dy, width, height ) {
        prismsView.whiteLightNode.setCanvasBounds( new Bounds2( -dx, -dy, width - dx, height - dy ) );
      protractorNodeListener.setDragBounds( new Bounds2( -dx, -dy, width - dx, height - dy ) );
      environmentMediumNode.setRect( -dx, -dy, width, height );
      }
    );

    this.resetPrismsView = function() {
      protractorNode.center = this.modelViewTransform.modelToViewXY( 0, 0 );
    };

    // Add a thin gray line to separate the navigation bar when the environmentMediumNode is black
    var navigationBarSeparator = new Rectangle( 0, 0, 100, 100, { fill: '#999999', pickable: false } );
    this.events.on( 'layoutFinished', function( dx, dy, width, height ) {
        var rectHeight = 2;
        navigationBarSeparator.setRect( -dx, -dy + height - rectHeight, width, rectHeight );
      }
    );
    prismsModel.laser.colorModeProperty.link( function( color ) {
      navigationBarSeparator.visible = color === 'white';
    } );
    this.addChild( navigationBarSeparator );

    prismsModel.laser.colorModeProperty.link( function( colorMode ) {
      MediumColorFactory.lightTypeProperty.value = colorMode;
    } );
  }

  return inherit( BendingLightView, PrismsView, {

    /**
     * @public
     */
    reset: function() {
      this.prismLayer.removeAllChildren();
      this.resetPrismsView();
    },

    /**
     * @protected
     * @param {number} dt - time
     */
    step: function() {
      BendingLightView.prototype.step.call( this );
      this.updateWhiteLightNode();
    },

    /**
     * @private, for internal use only.
     */
    updateWhiteLightNode: function() {
      if ( this.prismsModel.laser.colorMode === 'white' && this.prismsModel.dirty ) {
        this.whiteLightNode.step();
        this.prismsModel.dirty = false;
      }
    },

    addLightNodes: function() {
      var stageWidth = this.layoutBounds.width;
      var stageHeight = this.layoutBounds.height;
      var bendingLightView = this;

      var bendingLightModel = this.bendingLightModel;
      this.whiteLightNode = new WhiteLightCanvasNode(
        this.modelViewTransform,
        stageWidth,
        stageHeight,
        bendingLightModel.rays,
        this.prismsModel.environmentMediumProperty
      );
      this.whiteLightNode.setExcludeInvisible( true );

      // Since the light canvas is opaque, it must be placed behind the control panels.
      this.addChild( this.whiteLightNode );

      // switch between light render for white vs nonwhite light
      bendingLightModel.laser.colorModeProperty.link( function( color ) {
        var white = color === 'white';
        bendingLightView.whiteLightNode.setVisible( white );
      } );
    },

    addLaserHandles: function( showRotationDragHandlesProperty, showTranslationDragHandlesProperty, clockwiseArrowNotAtMax, ccwArrowNotAtMax, laserImageWidth ) {
      var bendingLightModel = this.bendingLightModel;
      BendingLightView.prototype.addLaserHandles.call( this, showRotationDragHandlesProperty, showTranslationDragHandlesProperty, clockwiseArrowNotAtMax, ccwArrowNotAtMax, laserImageWidth );

      // add translation indicators that show if/when the laser can be moved by dragging
      var arrowLength = 76;
      var horizontalTranslationDragHandle = new TranslationDragHandle( this.modelViewTransform, bendingLightModel.laser, arrowLength, 0,
        showTranslationDragHandlesProperty, laserImageWidth );
      this.addChild( horizontalTranslationDragHandle );
      var verticalTranslationDragHandle = new TranslationDragHandle( this.modelViewTransform, bendingLightModel.laser, 0, arrowLength,
        showTranslationDragHandlesProperty, laserImageWidth );
      this.addChild( verticalTranslationDragHandle );
    }
  } );
} );