import sys

execfile('./ml/neural_network.py')
if len(sys.argv) < 2:
    print("Usage: python predict.py <STRING IN THE FORM OF '[{String: [[float, float, float, float] * 200]}'] >")
    sys.exit(1)
arg = sys.argv[1]
samples = json.loads(arg)
createTrainAndSerializeNetwork(samples)
