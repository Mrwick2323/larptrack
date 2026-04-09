import base64

def decode_replay(s):
    data = base64.urlsafe_b64decode(s + "==")
    i = round(len(data) / 3.5)

    result = []

    for t in range(i):
        # 24-bit frame
        base = 3 * t
        frame = data[base] | (data[base+1] << 8) | (data[base+2] << 16)

        # control byte
        a = data[3*i + (t // 2)]

        if t % 2 == 0:
            up    = (a >> 0) & 1
            right = (a >> 1) & 1
            down  = (a >> 2) & 1
            left  = (a >> 3) & 1
        else:
            up    = (a >> 4) & 1
            right = (a >> 5) & 1
            down  = (a >> 6) & 1
            left  = (a >> 7) & 1

        result.append(f"({frame},{up}{right}{down}{left})")

    return "[" + ",".join(result) + "]"


# example usage
s = "AAAADAkAcAkAOAoAlAoAlw8A9BMANhQAOxYA7xgAKBwANCUAfyUA7zEAQjIACjMAbjMALjQAmjQAKDUA3zUAdTYAaTgAvDgAUjkA0ToApDwAXUEAm0oAfEsAXUwA1E0ASU4AMTGRkZGRMTExMTExAZGRMQE"

print(decode_replay(s))