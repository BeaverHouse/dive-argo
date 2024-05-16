---
sidebar_position: 2
---

# Set up Multi-node Cluster

We already created `k3s-master` node previously.  
In this document, we'll make 2 worker nodes to set up multi-node cluster, with `k3s-master` as a master node.

## Check master node token

Access to our VM Shell of `k3s-master`.

```
multipass shell k3s-master
```

To create worker node we need 2 values: master node's IP address and node token.[^1]  
We already know IP address[^2], and token can be checked by following command:

```
sudo cat /var/lib/rancher/k3s/server/node-token
```

Store this token for later use as your way.

## Create worker nodes

We'll create each worker node on individual VM.  
Create a new VM for worker node with Multipass, and access to it's VM Shell.

```
multipass launch jammy --name k3s-worker-1 --memory 2G --disk 50G --cpus 2

multipass shell k3s-worker-1
```

Type the command below to install K3S. Provide master node's IP address and node token stored before as a parameter.

```
curl -sfL https://get.k3s.io | K3S_URL=https://<master-ip>:6443 \
K3S_TOKEN=<master-node-token> \
INSTALL_K3S_EXEC="--node-name k3s-worker-1"  sh -
```

Also we can make another worker node `k3s-worker-2` with exactly same steps.

Type `kubectl get nodes` command to check whether the multi-node cluster is configured successfully.

```
NAME           STATUS   ROLES                  AGE     VERSION
k3s-worker-1   Ready    <none>                 3m54s   v1.27.7+k3s2
k3s-worker-2   Ready    <none>                 27s     v1.27.7+k3s2
k3s-master     Ready    control-plane,master   23m     v1.27.7+k3s2
```

<br/>

[^1]: https://docs.k3s.io/quick-start#install-script
[^2]: See [1. Hello Argo! - Install K3S][step1-3].

[step1-3]: https://dive-argo.haulrest.me/en/docs/hello/1-3-install-k3s#control-k8s-environment-on-host-computer

<!--Re-edited on 240120-->
