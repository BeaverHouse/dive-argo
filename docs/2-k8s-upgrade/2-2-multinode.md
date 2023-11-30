---
sidebar_position: 2
---

# Multi-node 클러스터 생성하기

현재 이미 우리는 `k3s-master` 노드를 생성한 상태입니다.   
이 `k3s-master` 노드를 Master node로 하고, 2개의 Worker node를 추가로 구성하여 Multi-node 클러스터를 구축해 보겠습니다.

## Master node의 토큰 확인하기

`k3s-master` VM shell에 접속합니다.

```
multipass shell k3s-master
```

Worker node를 생성하기 위해서는 Master node의 IP 주소와 token이 필요합니다.[^1]   
URL은 이미 알고 있는 상태고, token은 다음 명령어로 확인이 가능합니다.

```
sudo cat /var/lib/rancher/k3s/server/node-token
```

이 token 정보를 저장해 두도록 합시다. 방식은 자유입니다.

## Worker node 생성하기

Worker node는 별도의 VM에 생성하도록 하겠습니다.   
Worker node를 위한 새로운 VM을 생성하여 Shell에 접속합니다.

```
multipass launch jammy --name k3s-worker-1 --memory 2G --disk 50G --cpus 2

multipass shell k3s-worker-1
```

Shell에서 다음 명령어로 `k3s`를 설치합니다. Master node의 IP와 token을 여기서 사용합니다.

```
curl -sfL https://get.k3s.io | K3S_URL=https://<master-ip>:6443 \
K3S_TOKEN=<master-node-token> \
INSTALL_K3S_EXEC="--node-name k3s-worker-1"  sh -
```

동일한 방식으로 `k3s-worker-2` 노드도 생성해 줍니다.

이후 `kubectl get nodes` 를 입력해 다음과 같이 나오면 정상적으로 노드가 생성된 것입니다.

```
NAME           STATUS   ROLES                  AGE     VERSION
k3s-worker-1   Ready    <none>                 3m54s   v1.27.7+k3s2
k3s-worker-2   Ready    <none>                 27s     v1.27.7+k3s2
k3s-master     Ready    control-plane,master   23m     v1.27.7+k3s2
```

[^1]: https://docs.k3s.io/quick-start#install-script