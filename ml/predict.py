import sys
import json

execfile('./ml/neural_network.py')
if len(sys.argv) < 3:
    print("Usage: python predict.py <STRING IN THE FORM OF [[float, float, float, float] * 200]> <SERIALIZED ANN RECEIVED FROM TRAIN>")
    sys.exit(1)
arg = sys.argv[1]
arg2 = sys.argv[2]
samples = json.loads(arg)
serialized = json.loads(arg2)
predictState(serialized, samples)
