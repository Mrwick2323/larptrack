
async function simulate() {
    const inputString = window.__HEADLESS_INPUT;
    const upperConstraint = window.__HEADLESS_UPPER;
    const trackContent = window.__HEADLESS_TRACK_CONTENT;

    console.log("[HEADLESS] Starting simulation logic...");
    const { 
        Ammo, Au, Fu, bc, If, xh, Fl, zg, 
        resourceLoader, 
        materials: globalMaterials, 
        monitor: gameMonitor, 
        audio: gameAudio,
        mountainGen
    } = window._POLYTRACK_INTERNAL;

    // 1. Wait for Physics Resources
    console.log("[HEADLESS] Waiting for physics resources...");
    while (true) {
        const parts = globalMaterials.getAllParts();
        const materialsReady = parts.length > 0 && parts.every(p => p.physicsShape !== null);
        const carReady = bc._models && bc._models.collisionShape;
        
        if (materialsReady && carReady) break;
        await new Promise(r => setTimeout(r, 100));
    }
    console.log("[HEADLESS] Physics resources ready.");

    const mockMonitor = {
        scene: { add: () => {}, remove: () => {} },
        camera: { 
            position: { x:0, y:0, z:0, copy:()=>{} }, 
            quaternion: { x:0, y:0, z:0, w:1, copy:()=>{} },
            matrix: { decompose: () => {} },
            projectionMatrix: { elements: [] },
            matrixWorld: { elements: [] }
        },
        getShadowDirection: () => ({ x: 0, y: -1, z: 0 }),
        show: () => {},
        hide: () => {},
        update: () => {},
        setCamera: () => {},
        canvas: { width: 800, height: 600 }
    };

    const mockAudio = {
        getRecordTime: () => 1000000,
        setRecord: () => {},
        getBuffer: () => null,
        play: () => {},
        update: () => {},
        context: { currentTime: 0, createGain: () => ({ gain: { value: 0, setTargetAtTime: ()=>{} }, connect: () => {} }), createPanner: () => ({ positionX: { value: 0 }, positionY: { value: 0 }, positionZ: { value: 0 }, connect: () => {} }) }
    };

    // 2. Setup Track World
    let trackData;
    try {
        if (trackContent.startsWith("v1n")) {
            const exportData = Au.fromExportString(globalMaterials, trackContent);
            trackData = exportData.trackData;
        } else {
            trackData = Au.fromSaveString(globalMaterials, trackContent);
        }
    } catch (e) {
        console.error("[HEADLESS] Error decoding track: " + e.message);
        window.__finishTime = -3;
        return;
    }
    
    if (!trackData) {
        window.__finishTime = -3;
        return;
    }

    let partCount = 0;
    trackData.forEachPart(() => partCount++);
    console.log("[HEADLESS] Track parts decoded: " + partCount);

    const trackWorld = new Fu(mockMonitor, globalMaterials, mockMonitor);
    trackWorld.loadTrackData(trackData);
    trackWorld.generateMeshes(); 
    
    if (mountainGen) {
        console.log("[HEADLESS] Generating mountains...");
        mountainGen.generateMountains(trackWorld);
    }
    
    console.log("[HEADLESS] Track world initialized.");

    // 3. Setup Replay
    const recording = Fl.deserialize(inputString);
    const replayController = new If(recording);
    console.log("[HEADLESS] Replay deserialized. Frames: " + recording.length);

    // 4. Initialize Car
    const startTransform = trackWorld.getStartTransform();
    if (!startTransform) {
        console.error("[HEADLESS] Error: No start point found!");
        window.__finishTime = -2;
        return;
    }

    const car = new bc(
        startTransform, 
        replayController, 
        mockMonitor, 
        mockMonitor, 
        mockAudio, 
        mountainGen || { createPhysicsModels: () => {} }, 
        trackWorld, 
        resourceLoader
    );
    
    const initialPos = car.getPosition();
    console.log(`[HEADLESS] Car spawned at: (${initialPos.x.toFixed(2)}, ${initialPos.y.toFixed(2)}, ${initialPos.z.toFixed(2)})`);

    car.start();
    console.log("[HEADLESS] Starting simulation loop...");

    // 5. Simulation Loop
    let currentFrame = 0;
    const step = 0.001; 
    
    while (currentFrame * step <= upperConstraint && !car.hasFinished()) {
        try {
            car.update(step);
        } catch (e) {
            // console.warn("[HEADLESS] Warning in car.update: " + e.message);
        }
        currentFrame++;
        
        if (currentFrame % 5000 === 0) {
            const pos = car.getPosition();
            const speed = car.getSpeedKmh();
            console.log(`[HEADLESS] Time: ${(currentFrame * step).toFixed(2)}s | Speed: ${speed.toFixed(1)} km/h | Pos: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`);
        }
    }

    if (car.hasFinished()) {
        const time = car.getTime();
        console.log(`[HEADLESS] Finish line reached at ${time.toFixed(3)}s`);
        window.__finishTime = time;
    } else {
        const speed = car.getSpeedKmh();
        const pos = car.getPosition();
        console.log(`[HEADLESS] Simulation ended at time ${(currentFrame * step).toFixed(2)}s. Final Speed: ${speed.toFixed(1)} km/h. Final Pos: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`);
        window.__finishTime = -1;
    }
}
simulate();
