import sys
import json

execfile('./ml/neural_network.py')
if len(sys.argv) < 2:
    print("Usage: python predict.py [STRING IN THE FORM OF '[float, float, float, float]']")
    sys.exit(1)
arg = sys.argv[1]
X = json.loads(arg)
predictState(X)
