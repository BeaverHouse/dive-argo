---
sidebar_position: 2
---

# Set up Multi-node cluster

We already created `k3s-master` node previously.   
For now we'll make 2 worker nodes to setup multi-node cluster, with `k3s-master` as a master node.

## Check master node token

Access to our `k3s-master` VM Shell.

```
multipass shell k3s-master
```

To create worker node we need 2 variables: master node's IP address and node token.[^1]   
We already know IP address[^2], and token can be checked by following command:

```
sudo cat /var/lib/rancher/k3s/server/node-token
```

Store this token for later use as your way. 

## Create worker nodes

We'll create each worker node on another VM.   
Launch new VM for worker node by Multipass and access to VM Shell.

```
multipass launch jammy --name k3s-worker-1 --memory 2G --disk 50G --cpus 2

multipass shell k3s-worker-1
```

Type this command to install `k3s`. Master node's IP address and node token stored before need to be provided as a variable.

```
curl -sfL https://get.k3s.io | K3S_URL=https://<master-ip>:6443 \
K3S_TOKEN=<master-node-token> \
INSTALL_K3S_EXEC="--node-name k3s-worker-1"  sh -
```

Also we can make another worker node `k3s-worker-2` with exactly same process.

You can type `kubectl get nodes` to check whether the multi-node is configured successfully.

```
NAME           STATUS   ROLES                  AGE     VERSION
k3s-worker-1   Ready    <none>                 3m54s   v1.27.7+k3s2
k3s-worker-2   Ready    <none>                 27s     v1.27.7+k3s2
k3s-master     Ready    control-plane,master   23m     v1.27.7+k3s2
```

<br/>

[^1]: https://docs.k3s.io/quick-start#install-script  
[^2]: See [1. Hello Argo! - Install K3S][step1-3].

[step1-3]: https://beaverhouse.github.io/dive-argo/en/docs/hello/1-3-k3s#control-k8s-environment-on-host-computer