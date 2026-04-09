import base64
import math

def encode_replay(definition):
    # parse string into list
    items = definition.strip()[1:-1].split("),(")

    frames = []
    controls = []

    for item in items:
        item = item.replace("(", "").replace(")", "")
        frame_str, ctrl_str = item.split(",")

        frame = int(frame_str)
        u, r, d, l = map(int, ctrl_str)

        frames.append(frame)
        controls.append((u, r, d, l))

    i = len(frames)

    # build byte array
    data = bytearray()

    # 3 bytes per frame
    for frame in frames:
        data.append(frame & 0xFF)
        data.append((frame >> 8) & 0xFF)
        data.append((frame >> 16) & 0xFF)

    # control bytes (2 frames per byte)
    for t in range(0, i, 2):
        a = 0

        # even frame
        u, r, d, l = controls[t]
        a |= (u << 0)
        a |= (r << 1)
        a |= (d << 2)
        a |= (l << 3)

        # odd frame
        if t + 1 < i:
            u, r, d, l = controls[t+1]
            a |= (u << 4)
            a |= (r << 5)
            a |= (d << 6)
            a |= (l << 7)

        data.append(a)

    # encode
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


# example usage
definition = "[(0,1000),(2316,1100),(2416,1000),(2616,1100),(2708,1000),(3991,1001),(5108,1000),(5174,1001),(5691,1000),(6383,1001),(7208,1000),(9524,1001),(9599,1000),(12783,1100),(12866,1000),(13066,1100),(13166,1000),(13358,1100),(13466,1000),(13608,1100),(13791,1000),(13941,1100),(14441,1000),(14534,1100),(14674,1000),(15057,0000),(15524,1000),(16733,1001),(19099,1000),(19324,1001),(19549,1000),(19924,1100),(20041,1000)]"

print(encode_replay(definition))