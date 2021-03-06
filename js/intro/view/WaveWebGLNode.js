// Copyright 2015, University of Colorado Boulder

/**
 * Wave WebGl Rendering.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chandrashekar Bemagoni (Actual Concepts)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var WebGLNode = require( 'SCENERY/nodes/WebGLNode' );
  var ShaderProgram = require( 'SCENERY/util/ShaderProgram' );

  /**
   * @param {ModelViewTransform2} modelViewTransform - Transform between model and view coordinate frames
   * @param {ObservableArray<LightRay>} rays - light rays
   * @constructor
   */
  function WaveWebGLNode( modelViewTransform, rays ) {
    this.modelViewTransform = modelViewTransform; // @public (read-only)
    this.rays = rays; // @private
    WebGLNode.call( this );
  }

  return inherit( WebGLNode, WaveWebGLNode, {

    /**
     * @protected
     * @param {Drawable} drawable
     */
    initializeWebGLDrawable: function( drawable ) {
      var gl = drawable.gl;

      // Simple example for custom shader
      var vertexShaderSource = [

        // Position
        'attribute vec3 aPosition;', // vertex attribute
        'uniform mat3 uModelViewMatrix;',
        'uniform mat3 uProjectionMatrix;',
        'varying vec2 vPosition;',
        'void main( void ) {',
        '  vPosition = aPosition.xy;',

        // homogeneous model-view transformation
        'vec3 view = uModelViewMatrix * vec3( aPosition.xy, 1 );',

        // homogeneous map to normalized device coordinates
        'vec3 ndc = uProjectionMatrix * vec3( view.xy, 1 );',

        // combine with the z coordinate specified
        'gl_Position = vec4( ndc.xy, aPosition.z, 1.0 );',
        '}'
      ].join( '\n' );

      // custom fragment shader
      var fragmentShaderSource = [
        'precision mediump float;',
        'uniform float uPowerFraction;', // light ray power fraction
        'uniform vec2 uTail;', // Tail point
        'uniform float uAngle;', // Angle of the ColoredRay
        'uniform float uWaveLength;', // Wavelength of the ColoredRay
        'uniform float uPhase;', // phase difference of the ColoredRay
        'uniform vec3 uColor;', // Color of the wave
        'varying vec2 vPosition;',
        'void main( void ) {',

        // Perpendicular distance from tail to rendering coordinate. This is obtained by Coordinate Transformation to
        // tail point and applying dot product to the unit vector in the direction of ray and rendering coordinate
        'float distance = dot(vec2(cos(uAngle),sin(uAngle)), vec2(vPosition.x-uTail.x,uTail.y - vPosition.y));',

        // finding the position of rendering coordinate in each wave particle to determine the color of the pixel
        'float positionDiff = mod( abs( distance - uPhase), uWaveLength);',

        // color is determined by perpendicular distance of coordinate from the start of the particle.
        'float colorFactor = abs( 1.0 - positionDiff / ( uWaveLength * 0.5 ) );',
        'gl_FragColor.rgb = uColor * (colorFactor * uPowerFraction);',
        'gl_FragColor.a = sqrt(uPowerFraction);',
        '}'
      ].join( '\n' );

      drawable.shaderProgram = new ShaderProgram( gl, vertexShaderSource, fragmentShaderSource, {
        attributes: [ 'aPosition' ],
        uniforms: [ 'uModelViewMatrix', 'uProjectionMatrix', 'uPowerFraction', 'uTail', 'uAngle', 'uWaveLength',
          'uPhase', 'uColor' ]
      } );
      drawable.vertexBuffer = gl.createBuffer();
    },

    /**
     * @protected
     * @param {Drawable} drawable
     * @param {Matrix3} matrix
     */
    paintWebGLDrawable: function( drawable, matrix ) {
      var gl = drawable.gl;
      var shaderProgram = drawable.shaderProgram;

      shaderProgram.use();

      for ( var i = this.rays.length - 1; i >= 0; i-- ) {
        var elements = [];
        var red;
        var green;
        var blue;
        var lightRay = this.rays.get( i );
        var lightRayWaveSubPath = lightRay.waveShape.subpaths[ 0 ];

        // get the x and y coordinates of wave corner points
        var point1X = this.modelViewTransform.modelToViewX( lightRayWaveSubPath.points[ 0 ].x );
        var point1Y = this.modelViewTransform.modelToViewY( lightRayWaveSubPath.points[ 0 ].y );
        var point2X = this.modelViewTransform.modelToViewX( lightRayWaveSubPath.points[ 1 ].x );
        var point2Y = this.modelViewTransform.modelToViewY( lightRayWaveSubPath.points[ 1 ].y );
        var point3X = this.modelViewTransform.modelToViewX( lightRayWaveSubPath.points[ 3 ].x );
        var point3Y = this.modelViewTransform.modelToViewY( lightRayWaveSubPath.points[ 3 ].y );
        var point4X = this.modelViewTransform.modelToViewX( lightRayWaveSubPath.points[ 2 ].x );
        var point4Y = this.modelViewTransform.modelToViewY( lightRayWaveSubPath.points[ 2 ].y );

        // points to draw light ray beam
        elements.push( point1X, point1Y, 1 );
        elements.push( point2X, point2Y, 1 );
        elements.push( point3X, point3Y, 1 );
        elements.push( point4X, point4Y, 1 );

        // light ray power fraction
        var lightRayPowerFraction = lightRay.powerFraction;

        // tail position in view co-ordinates
        var tailViewX = this.modelViewTransform.modelToViewX( lightRay.tail.x );
        var tailViewY = this.modelViewTransform.modelToViewY( lightRay.tail.y );

        // light ray angle
        var lightRayAngle = lightRay.getAngle();

        // light ray wavelength
        var wavelength = this.modelViewTransform.modelToViewDeltaX( lightRay.wavelength );

        // phase
        var totalPhaseOffsetInNumberOfWavelengths = lightRay.getPhaseOffset() / 2 / Math.PI;
        var phaseDiff = this.modelViewTransform.modelToViewDeltaX(
          // Just keep the fractional part
          (totalPhaseOffsetInNumberOfWavelengths % 1) * lightRay.wavelength
        );

        // light ray color
        red = lightRay.color.r / 255;
        green = lightRay.color.g / 255;
        blue = lightRay.color.b / 255;

        gl.bindBuffer( gl.ARRAY_BUFFER, drawable.vertexBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( elements ), gl.STATIC_DRAW );

        gl.uniformMatrix3fv( shaderProgram.uniformLocations.uModelViewMatrix, false,
          new Float32Array( matrix.entries ) );
        gl.uniformMatrix3fv( shaderProgram.uniformLocations.uProjectionMatrix, false,
          new Float32Array( drawable.webGLBlock.projectionMatrixArray ) );
        gl.uniform1f( shaderProgram.uniformLocations.uPowerFraction, lightRayPowerFraction );
        gl.uniform2f( shaderProgram.uniformLocations.uTail, tailViewX, tailViewY );
        gl.uniform1f( shaderProgram.uniformLocations.uAngle, lightRayAngle );
        gl.uniform1f( shaderProgram.uniformLocations.uWaveLength, wavelength );
        gl.uniform1f( shaderProgram.uniformLocations.uPhase, phaseDiff );
        gl.uniform3f( shaderProgram.uniformLocations.uColor, red, green, blue );

        gl.bindBuffer( gl.ARRAY_BUFFER, drawable.vertexBuffer );
        gl.vertexAttribPointer( shaderProgram.attributeLocations.aPosition, 3, gl.FLOAT, false, 0, 0 );

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
      shaderProgram.unuse();
    },

    /**
     * @protected
     * @param {Drawable} drawable
     */
    disposeWebGLDrawable: function( drawable ) {
      drawable.shaderProgram.dispose();
      drawable.gl.deleteBuffer( drawable.vertexBuffer );
      drawable.shaderProgram = null;
    },

    /**
     * @public
     */
    step: function() {
      this.invalidatePaint();
    }
  } );
} );