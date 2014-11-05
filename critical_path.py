def get_critical_path(graph):
	node_earliest_value = {}
	node_earliest_value[graph.keys()[0]] = 0
	node_earliest_value.update(get_earliest_values(graph, 0))

	depth_fake_node = max(node_earliest_value.values()) + 1
	node_latest_value = get_latest_value_dict(graph, depth_fake_node)

	critical_path_nodes = []
	slack_nodes = {}
	for k in node_earliest_value.keys():
		if node_earliest_value[k] == node_latest_value[k]:
			critical_path_nodes.append(k)
		else:
			slack_nodes[k] = {"node_earliest_value": node_earliest_value[k], "node_latest_value": node_latest_value[k]}

	return (critical_path_nodes, slack_nodes)


def get_earliest_values(subtree, depth):
	earliest_value_dict = {}
	children = subtree.values()[0]
	if children is None:
		return {}
	for child in children:
		earliest_value_dict[child.keys()[0]] = depth+1
		earliest_value_dict.update(get_earliest_values(child, depth+1))
	
	return earliest_value_dict


def get_latest_values(subtree, max_depth):
	latest_value_dict = {}
	children = subtree.values()[0]
	if children is None:
		return max_depth-1

	node_latest_value = min([get_latest_values(x, max_depth) for x in children]) -1
	return node_latest_value

def get_latest_value_dict(subtree, max_depth):

	latest_value_dict = {}
	children = subtree.values()[0]
	latest_value_dict[subtree.keys()[0]] = get_latest_values(subtree, max_depth)
	if children is None:
		latest_value_dict[subtree.keys()[0]] = max_depth-1
		return latest_value_dict
	for child in children:
		latest_value_dict[child.keys()[0]] = get_latest_values(child, max_depth)
		latest_value_dict.update(get_latest_value_dict(child, max_depth))
	return latest_value_dict


test_dict = {'index.html': [{'js_dep3.js': [{'js_nodep3.js': None}]}, {'image6.png': None}]}
test_dict2 = {"A": [{"B": [{"C": None}, {"D":None}]}, {"E":[{"F":None}, {"G": [{"H":[{"I":None}, {"J":None}]},{"K":[{"L":None},{"M":None}]}]}]}]}

#print get_critical_path(test_dict2)
#print get_critical_path(test_dict)
