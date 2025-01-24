// @ts-ignore
import NET from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';

export const initializeVanta = () => {
    NET({
        el: "body",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 0.50,
        scaleMobile: 0.50,
        color: 0x1E5631,
        backgroundColor: 0x0B3D0B,
        points: 10.00,
        maxDistance: 20.00,
        spacing: 15.00,
        THREE: THREE
    });
};